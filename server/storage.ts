import { 
  type User, 
  type InsertUser, 
  type Employee, 
  type InsertEmployee, 
  type Letter, 
  type InsertLetter, 
  type SubscriptionPlan, 
  type UserSubscription, 
  type InsertUserSubscription, 
  type CommissionRecord,
  users,
  employees,
  letters,
  subscriptionPlans,
  userSubscriptions,
  commissionRecords
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User>;

  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByDiscountCode(code: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee>;
  getAllEmployees(): Promise<Employee[]>;

  // Letter methods
  getLetter(id: string): Promise<Letter | undefined>;
  getLettersByUser(userId: string): Promise<Letter[]>;
  getAllLetters(): Promise<Letter[]>;
  createLetter(letter: InsertLetter): Promise<Letter>;
  updateLetter(id: string, updates: Partial<Letter>): Promise<Letter>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription>;

  // Commission methods
  getCommissionsByEmployee(employeeId: string): Promise<CommissionRecord[]>;
  createCommissionRecord(record: Omit<CommissionRecord, 'id' | 'createdAt'>): Promise<CommissionRecord>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client);
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if subscription plans already exist
      const existingPlans = await this.db.select().from(subscriptionPlans);
      
      if (existingPlans.length === 0) {
        // Create default subscription plans
        const defaultPlans = [
          {
            name: 'Single Letter',
            description: 'One professional legal letter',
            letterCount: 1,
            price: '299.00',
            billingCycle: 'one-time' as const,
            isActive: true,
            features: ['AI-generated content', 'Attorney review', 'PDF download']
          },
          {
            name: 'Monthly Plan',
            description: 'Four letters per month',
            letterCount: 48,
            price: '299.00',
            billingCycle: 'yearly' as const,
            isActive: true,
            features: ['48 letters/year', 'Priority review', 'PDF downloads', 'Email support']
          },
          {
            name: 'Premium Plan',
            description: 'Eight letters per month',
            letterCount: 96,
            price: '599.00',
            billingCycle: 'yearly' as const,
            isActive: true,
            features: ['96 letters/year', 'Priority review', 'PDF downloads', 'Priority support', 'Custom templates']
          }
        ];

        await this.db.insert(subscriptionPlans).values(defaultPlans);
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({
      ...insertUser,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await this.db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    return result[0];
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    return this.updateUser(userId, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User> {
    return this.updateUser(userId, { 
      stripeCustomerId: info.customerId, 
      stripeSubscriptionId: info.subscriptionId 
    });
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    const result = await this.db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }

  async getEmployeeByDiscountCode(code: string): Promise<Employee | undefined> {
    const result = await this.db.select().from(employees).where(eq(employees.discountCode, code));
    return result[0];
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const result = await this.db.insert(employees).values({
      ...insertEmployee,
      totalCommission: '0.00',
      totalPoints: 0
    }).returning();
    return result[0];
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const result = await this.db.update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Employee not found');
    }
    return result[0];
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await this.db.select().from(employees);
  }

  // Letter methods
  async getLetter(id: string): Promise<Letter | undefined> {
    const result = await this.db.select().from(letters).where(eq(letters.id, id));
    return result[0];
  }

  async getLettersByUser(userId: string): Promise<Letter[]> {
    return await this.db.select().from(letters).where(eq(letters.userId, userId));
  }

  async getAllLetters(): Promise<Letter[]> {
    return await this.db.select().from(letters);
  }

  async createLetter(insertLetter: InsertLetter): Promise<Letter> {
    const result = await this.db.insert(letters).values({
      ...insertLetter,
      status: 'requested'
    }).returning();
    return result[0];
  }

  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter> {
    const result = await this.db.update(letters)
      .set(updates)
      .where(eq(letters.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Letter not found');
    }
    return result[0];
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await this.db.select().from(subscriptionPlans);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const result = await this.db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ));
    return result[0];
  }

  async createUserSubscription(insertSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const result = await this.db.insert(userSubscriptions).values({
      ...insertSubscription,
      cancelledAt: null
    }).returning();
    return result[0];
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const result = await this.db.update(userSubscriptions)
      .set(updates)
      .where(eq(userSubscriptions.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Subscription not found');
    }
    return result[0];
  }

  // Commission methods
  async getCommissionsByEmployee(employeeId: string): Promise<CommissionRecord[]> {
    return await this.db.select().from(commissionRecords).where(eq(commissionRecords.employeeId, employeeId));
  }

  async createCommissionRecord(record: Omit<CommissionRecord, 'id' | 'createdAt'>): Promise<CommissionRecord> {
    const result = await this.db.insert(commissionRecords).values(record).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();