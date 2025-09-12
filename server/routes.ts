import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLetterSchema, insertUserSubscriptionSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import OpenAI from "openai";

// Environment validation
if (!process.env.SESSION_SECRET) {
  throw new Error('Missing required SESSION_SECRET');
}

// Optional API keys for development - warn but don't fail
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not provided - payment features will be disabled');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not provided - AI letter generation will be disabled');
}

if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not provided - checkout functionality will be limited');
}

// Initialize services only if API keys are available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
}) : null;

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Middleware for JWT authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET!) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

// Helper function to generate discount code
const generateDiscountCode = (fullName: string): string => {
  const initials = fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('');
  return `EMPLOYEE20-${initials}`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, fullName, userType = 'user', phone, companyName } = req.body;
      
      // Validate input
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        userType,
        phone,
        companyName
      });

      // If employee, create employee record
      if (userType === 'employee') {
        const discountCode = generateDiscountCode(fullName);
        await storage.createEmployee({
          id: user.id,
          discountCode,
          commissionRate: '0.05',
          discountPercentage: 20,
          isActive: true,
          performanceTier: 'bronze'
        });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.SESSION_SECRET!, { expiresIn: '7d' });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName, 
          userType: user.userType 
        } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SESSION_SECRET!, { expiresIn: '7d' });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName, 
          userType: user.userType 
        } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      res.json({ 
        user: { 
          id: req.user.id, 
          email: req.user.email, 
          fullName: req.user.fullName, 
          userType: req.user.userType 
        } 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User subscription
  app.get("/api/user/subscription", authenticateToken, async (req: any, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment intent for one-time purchases
  app.post("/api/create-payment-intent", authenticateToken, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment processing is not available - Stripe not configured" });
      }

      const { planId, discountCode } = req.body;
      
      const plans = await storage.getSubscriptionPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      let finalPrice = parseFloat(plan.price);
      let discountAmount = 0;
      let employee = null;

      // Apply discount if code provided
      if (discountCode) {
        employee = await storage.getEmployeeByDiscountCode(discountCode);
        if (employee && employee.isActive && employee.discountPercentage) {
          discountAmount = finalPrice * (employee.discountPercentage / 100);
          finalPrice -= discountAmount;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalPrice * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id,
          planId,
          discountCode: discountCode || '',
          originalPrice: plan.price,
          discountAmount: discountAmount.toString(),
          finalPrice: finalPrice.toString()
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook for payment confirmation
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { userId, planId, discountCode, originalPrice, discountAmount, finalPrice } = paymentIntent.metadata;

        const plans = await storage.getSubscriptionPlans();
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
          return res.status(404).json({ error: "Plan not found" });
        }

        // Create user subscription
        const subscription = await storage.createUserSubscription({
          userId,
          planId,
          discountCodeUsed: discountCode || null,
          originalPrice,
          discountAmount,
          finalPrice,
          lettersRemaining: plan.letterCount,
          lettersUsed: 0,
          status: 'active',
          expiresAt: plan.billingCycle === 'yearly' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
        });

        // Create commission record if discount code was used
        if (discountCode) {
          const employee = await storage.getEmployeeByDiscountCode(discountCode);
          if (employee && employee.commissionRate) {
            const commissionAmount = parseFloat(finalPrice) * parseFloat(employee.commissionRate);
            await storage.createCommissionRecord({
              employeeId: employee.id,
              subscriptionId: subscription.id,
              commissionAmount: commissionAmount.toString(),
              pointsEarned: 1,
              commissionRate: employee.commissionRate,
              status: 'pending',
              paidAt: null
            });

            // Update employee totals
            const currentTotalCommission = employee.totalCommission ? parseFloat(employee.totalCommission) : 0;
            const currentTotalPoints = employee.totalPoints || 0;
            const newTotalCommission = currentTotalCommission + commissionAmount;
            const newTotalPoints = currentTotalPoints + 1;
            await storage.updateEmployee(employee.id, {
              totalCommission: newTotalCommission.toString(),
              totalPoints: newTotalPoints
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Letters
  app.get("/api/letters", authenticateToken, async (req: any, res) => {
    try {
      let letters;
      if (req.user.userType === 'admin') {
        letters = await storage.getAllLetters();
      } else {
        letters = await storage.getLettersByUser(req.user.id);
      }
      res.json(letters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/letters", authenticateToken, async (req: any, res) => {
    try {
      // Check if user has active subscription with letters remaining
      const subscription = await storage.getUserSubscription(req.user.id);
      if (!subscription || subscription.lettersRemaining <= 0) {
        return res.status(400).json({ error: "No active subscription or letters remaining" });
      }

      const letterData = insertLetterSchema.parse({
        ...req.body,
        userId: req.user.id,
        subscriptionId: subscription.id
      });

      const letter = await storage.createLetter(letterData);

      // Update subscription letters remaining
      await storage.updateUserSubscription(subscription.id, {
        lettersRemaining: subscription.lettersRemaining - 1,
        lettersUsed: subscription.lettersUsed + 1
      });

      // Generate AI content asynchronously
      generateLetterContent(letter.id);

      res.json(letter);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/letters/:id", authenticateToken, async (req: any, res) => {
    try {
      const letter = await storage.getLetter(req.params.id);
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      // Check permissions
      if (req.user.userType !== 'admin' && letter.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(letter);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/letters/:id", authenticateToken, async (req: any, res) => {
    try {
      const letter = await storage.getLetter(req.params.id);
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      // Only admins can update letters (for attorney review)
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedLetter = await storage.updateLetter(req.params.id, req.body);
      res.json(updatedLetter);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee dashboard data
  app.get("/api/employee/dashboard", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.userType !== 'employee') {
        return res.status(403).json({ error: "Access denied" });
      }

      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const commissions = await storage.getCommissionsByEmployee(employee.id);
      
      res.json({
        employee,
        commissions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin dashboard data
  app.get("/api/admin/dashboard", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const users = await storage.getAllUsers?.() || [];
      const letters = await storage.getAllLetters();
      const employees = await storage.getAllEmployees();

      res.json({
        totalUsers: users.length,
        totalLetters: letters.length,
        activeEmployees: employees.filter(e => e.isActive).length,
        recentLetters: letters.slice(-10).reverse(),
        topEmployees: employees.sort((a, b) => parseFloat(b.totalCommission) - parseFloat(a.totalCommission)).slice(0, 5)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI letter generation helper function
  async function generateLetterContent(letterId: string) {
    try {
      const letter = await storage.getLetter(letterId);
      if (!letter) return;

      const prompt = `Generate a professional legal letter with the following details:
      
      Sender: ${letter.senderName}${letter.senderFirmName ? ` from ${letter.senderFirmName}` : ''}
      Recipient: ${letter.recipientName}
      Subject: ${letter.subject}
      Conflict: ${letter.conflictDescription}
      Desired Resolution: ${letter.desiredResolution}
      ${letter.additionalNotes ? `Additional Notes: ${letter.additionalNotes}` : ''}
      
      Please format this as a formal legal letter with proper legal language and structure. Include appropriate legal terminology and maintain a professional tone throughout. The letter should clearly state the issue, reference relevant facts, and specify the desired resolution.
      
      Return the response in JSON format with the following structure:
      {
        "content": "The full letter content",
        "summary": "Brief summary of the letter"
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional legal assistant specializing in drafting formal legal correspondence. Generate professional, legally sound letters with appropriate formatting and language."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      await storage.updateLetter(letterId, {
        aiPrompt: prompt,
        aiGeneratedContent: result.content,
        status: 'reviewing',
        aiGeneratedAt: new Date()
      });

    } catch (error) {
      console.error('Error generating letter content:', error);
      await storage.updateLetter(letterId, {
        status: 'requested' // Reset status on error
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
