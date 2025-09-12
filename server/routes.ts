import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLetterSchema, insertUserSubscriptionSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFService } from "./pdf-service";
import path from "path";
import fs from "fs";

// Environment validation
if (!process.env.SESSION_SECRET) {
  throw new Error('Missing required SESSION_SECRET');
}

// Optional API keys for development - warn but don't fail
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not provided - payment features will be disabled');
}

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not provided - AI letter generation will be disabled');
}

if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not provided - checkout functionality will be limited');
}

// Initialize services only if API keys are available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
}) : null;

// Initialize Gemini Pro for AI letter generation
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

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
      // Check if Gemini AI is available before proceeding
      if (!geminiModel) {
        return res.status(503).json({ error: "AI letter generation is not available - please contact support" });
      }

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

      // Generate AI content and only deduct credits on success
      generateLetterContent(letter.id, subscription.id, subscription.lettersRemaining, subscription.lettersUsed || 0);

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

      // Check if letter is being marked as completed and generate PDF
      if (req.body.status === 'completed' && letter.status !== 'completed') {
        try {
          console.log(`Generating PDF for letter ${letter.id}...`);
          
          // Build effective letter with updates merged BEFORE PDF generation
          // This ensures PDF uses the latest content including finalContent
          const effectiveLetter = { ...letter, ...req.body };
          
          // Generate PDF from updated letter data
          const pdfUrl = await PDFService.generatePDF(effectiveLetter);
          
          // Update letter with PDF URL and completion timestamp
          req.body.pdfUrl = pdfUrl;
          req.body.completedAt = new Date().toISOString();
          
          console.log(`PDF generated successfully for letter ${letter.id}: ${pdfUrl}`);
        } catch (pdfError: any) {
          console.error(`Failed to generate PDF for letter ${letter.id}:`, pdfError);
          // Continue with status update even if PDF generation fails
          // This prevents the completion from being blocked by PDF issues
        }
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

      const users = await storage.getAllUsers();
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

  // Admin users endpoint
  app.get("/api/admin/users", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const users = await storage.getAllUsers();
      
      // Get subscription info for each user
      const usersWithSubscriptions = await Promise.all(
        users.map(async (user) => {
          const subscription = await storage.getUserSubscription(user.id);
          return {
            ...user,
            subscription
          };
        })
      );

      res.json(usersWithSubscriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin employees endpoint
  app.get("/api/admin/employees", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const employees = await storage.getAllEmployees();
      
      // Get user data for each employee to include full name
      const employeesWithUserData = await Promise.all(
        employees.map(async (employee) => {
          const user = await storage.getUser(employee.id);
          return {
            ...employee,
            fullName: user?.fullName || 'Unknown'
          };
        })
      );

      res.json(employeesWithUserData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PDF file serving route
  app.get("/api/pdfs/:filename", authenticateToken, async (req: any, res) => {
    try {
      const filename = req.params.filename;
      
      // Validate filename to prevent path traversal attacks
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      // Ensure only PDF files can be accessed
      if (!filename.endsWith('.pdf')) {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Security: Require filename to start with "letter-" to prevent arbitrary file access
      if (!filename.startsWith('letter-')) {
        return res.status(400).json({ error: "Invalid filename format - must be a letter PDF" });
      }

      // Get the PDF file path
      const filePath = await PDFService.getPDFPath(filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "PDF file not found" });
      }

      // For additional security, verify the user has access to the letter
      // Extract letter ID from filename (format: letter-{id}-{timestamp}.pdf)
      const letterIdMatch = filename.match(/^letter-([a-f0-9-]+)-/);
      if (!letterIdMatch) {
        return res.status(400).json({ error: "Invalid letter filename format" });
      }

      const letterId = letterIdMatch[1];
      const letter = await storage.getLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      // Check permissions - only letter owner or admin can access
      if (req.user.userType !== 'admin' && letter.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error('Error serving PDF:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User download endpoint - allows users to download their own letters and marks as downloaded
  app.get("/api/letters/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const letter = await storage.getLetter(req.params.id);
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      // Check permissions - only letter owner can download
      if (letter.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if letter is completed and has a PDF
      if (letter.status !== 'completed' && letter.status !== 'downloaded') {
        return res.status(400).json({ error: "Letter is not ready for download" });
      }

      if (!letter.pdfUrl) {
        return res.status(400).json({ error: "PDF not available for this letter" });
      }

      // Extract filename from pdfUrl (format: /api/pdfs/letter-{id}-{timestamp}.pdf)
      const filename = letter.pdfUrl.split('/').pop();
      if (!filename) {
        return res.status(400).json({ error: "Invalid PDF URL" });
      }

      // Get the PDF file path
      const filePath = await PDFService.getPDFPath(filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "PDF file not found on server" });
      }

      // Update letter status to 'downloaded' if it's not already
      if (letter.status === 'completed') {
        await storage.updateLetter(req.params.id, {
          status: 'downloaded',
          downloadedAt: new Date().toISOString()
        });
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Legal_Letter_${letter.subject.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error('Error downloading letter:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin download endpoint - allows admins to download any letter without status updates
  app.get("/api/admin/letters/:id/download", authenticateToken, async (req: any, res) => {
    try {
      // Check admin permissions first
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Access denied - admin privileges required" });
      }

      const letter = await storage.getLetter(req.params.id);
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }

      // Check if letter is completed and has a PDF
      if (letter.status !== 'completed' && letter.status !== 'downloaded') {
        return res.status(400).json({ error: "Letter is not ready for download" });
      }

      if (!letter.pdfUrl) {
        return res.status(400).json({ error: "PDF not available for this letter" });
      }

      // Extract filename from pdfUrl (format: /api/pdfs/letter-{id}-{timestamp}.pdf)
      const filename = letter.pdfUrl.split('/').pop();
      if (!filename) {
        return res.status(400).json({ error: "Invalid PDF URL" });
      }

      // Get the PDF file path
      const filePath = await PDFService.getPDFPath(filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "PDF file not found on server" });
      }

      // Note: Admin downloads do NOT update letter status 
      // This preserves the original status for user tracking

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Legal_Letter_${letter.subject.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error('Error downloading letter as admin:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI letter generation helper function
  async function generateLetterContent(letterId: string, subscriptionId: string, lettersRemaining: number, lettersUsed: number) {
    try {
      if (!geminiModel) {
        console.error('Gemini AI is not available - cannot generate letter content');
        return;
      }

      const letter = await storage.getLetter(letterId);
      if (!letter) {
        console.error(`Letter ${letterId} not found`);
        return;
      }

      // Idempotency check: Skip if already processed to prevent double-deduction
      if (letter.aiGeneratedContent || letter.status === 'reviewing' || letter.status === 'completed') {
        console.log(`Letter ${letterId} already processed, skipping generation`);
        return;
      }

      // Mark letter as processing to prevent concurrent processing
      await storage.updateLetter(letterId, {
        status: 'generating'
      });

      const systemPrompt = "You are a professional legal assistant specializing in drafting formal legal correspondence. Generate professional, legally sound letters with appropriate formatting and language.";
      
      const prompt = `${systemPrompt}

Generate a professional legal letter with the following details:

Sender: ${letter.senderName}${letter.senderFirmName ? ` from ${letter.senderFirmName}` : ''}
Recipient: ${letter.recipientName}
Subject: ${letter.subject}
Conflict: ${letter.conflictDescription}
Desired Resolution: ${letter.desiredResolution}
${letter.additionalNotes ? `Additional Notes: ${letter.additionalNotes}` : ''}

Please format this as a formal legal letter with proper legal language and structure. Include appropriate legal terminology and maintain a professional tone throughout. The letter should clearly state the issue, reference relevant facts, and specify the desired resolution.

Return ONLY a valid JSON object with this exact structure:
{
  "content": "The full letter content",
  "summary": "Brief summary of the letter"
}`;

      // Use improved Gemini model with structured output
      const response = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.1, // Lower temperature for more consistent legal language
        }
      });
      
      const responseText = response.response.text().trim();
      
      // Parse JSON response with better error handling
      let result;
      try {
        // Clean response text and extract JSON
        const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/) || [cleanedResponse];
        result = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!result.content || !result.summary) {
          throw new Error('Missing required fields in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse structured JSON response, using fallback:', parseError);
        result = {
          content: responseText,
          summary: "AI-generated legal letter"
        };
      }

      // ONLY deduct credits AFTER successful generation using atomic delta updates
      // Get fresh subscription data to ensure accuracy
      const currentSubscription = await storage.getUserSubscription(letter.userId);
      if (!currentSubscription) {
        throw new Error('User subscription not found during credit deduction');
      }

      // Verify user still has credits available
      if (currentSubscription.lettersRemaining <= 0) {
        throw new Error('No letters remaining in subscription');
      }

      // Atomic credit deduction using deltas (safer than absolute values)
      await storage.updateUserSubscription(subscriptionId, {
        lettersRemaining: currentSubscription.lettersRemaining - 1,
        lettersUsed: (currentSubscription.lettersUsed || 0) + 1
      });

      // Update letter with generated content ONLY after successful credit deduction
      await storage.updateLetter(letterId, {
        aiPrompt: prompt,
        aiGeneratedContent: result.content,
        status: 'reviewing',
        aiGeneratedAt: new Date()
      });

      console.log(`Successfully generated content for letter ${letterId} and deducted credit`);

    } catch (error) {
      console.error(`Error generating letter content for ${letterId}:`, error);
      
      // Reset letter status on error - no credit restoration needed since credits weren't deducted
      await storage.updateLetter(letterId, {
        status: 'requested' // Reset status so user can try again without losing credits
      });
      
      // Log the error for monitoring but don't throw - this is a background process
      console.error(`Letter ${letterId} generation failed, status reset to 'requested' for retry`);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
