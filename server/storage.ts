import { type User, type InsertUser, type Employee, type InsertEmployee, type Letter, type InsertLetter, type SubscriptionPlan, type UserSubscription, type InsertUserSubscription, type CommissionRecord } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private employees: Map<string, Employee> = new Map();
  private letters: Map<string, Letter> = new Map();
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
  private userSubscriptions: Map<string, UserSubscription> = new Map();
  private commissionRecords: Map<string, CommissionRecord> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default subscription plans
    const singlePlan: SubscriptionPlan = {
      id: randomUUID(),
      name: 'Single Letter',
      description: 'One professional legal letter',
      letterCount: 1,
      price: '299.00',
      billingCycle: 'one-time',
      isActive: true,
      features: ['AI-generated content', 'Attorney review', 'PDF download'],
      createdAt: new Date()
    };

    const monthlyPlan: SubscriptionPlan = {
      id: randomUUID(),
      name: 'Monthly Plan',
      description: 'Four letters per month',
      letterCount: 48,
      price: '299.00',
      billingCycle: 'yearly',
      isActive: true,
      features: ['48 letters/year', 'Priority review', 'PDF downloads', 'Email support'],
      createdAt: new Date()
    };

    const premiumPlan: SubscriptionPlan = {
      id: randomUUID(),
      name: 'Premium Plan',
      description: 'Eight letters per month',
      letterCount: 96,
      price: '599.00',
      billingCycle: 'yearly',
      isActive: true,
      features: ['96 letters/year', 'Priority review', 'PDF downloads', 'Priority support', 'Custom templates'],
      createdAt: new Date()
    };

    this.subscriptionPlans.set(singlePlan.id, singlePlan);
    this.subscriptionPlans.set(monthlyPlan.id, monthlyPlan);
    this.subscriptionPlans.set(premiumPlan.id, premiumPlan);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    return this.employees.get(id);
  }

  async getEmployeeByDiscountCode(code: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.discountCode === code);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      ...insertEmployee,
      totalCommission: '0.00',
      totalPoints: 0,
      createdAt: new Date()
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const employee = this.employees.get(id);
    if (!employee) throw new Error('Employee not found');
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  // Letter methods
  async getLetter(id: string): Promise<Letter | undefined> {
    return this.letters.get(id);
  }

  async getLettersByUser(userId: string): Promise<Letter[]> {
    return Array.from(this.letters.values()).filter(letter => letter.userId === userId);
  }

  async getAllLetters(): Promise<Letter[]> {
    return Array.from(this.letters.values());
  }

  async createLetter(insertLetter: InsertLetter): Promise<Letter> {
    const id = randomUUID();
    const letter: Letter = {
      ...insertLetter,
      id,
      status: 'requested',
      createdAt: new Date(),
      aiGeneratedAt: null,
      reviewedAt: null,
      completedAt: null,
      downloadedAt: null
    };
    this.letters.set(id, letter);
    return letter;
  }

  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter> {
    const letter = this.letters.get(id);
    if (!letter) throw new Error('Letter not found');
    
    const updatedLetter = { ...letter, ...updates };
    this.letters.set(id, updatedLetter);
    return updatedLetter;
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values()).filter(plan => plan.isActive);
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptions.values()).find(sub => sub.userId === userId && sub.status === 'active');
  }

  async createUserSubscription(insertSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = randomUUID();
    const subscription: UserSubscription = {
      ...insertSubscription,
      id,
      createdAt: new Date(),
      cancelledAt: null
    };
    this.userSubscriptions.set(id, subscription);
    return subscription;
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const subscription = this.userSubscriptions.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updatedSubscription = { ...subscription, ...updates };
    this.userSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Commission methods
  async getCommissionsByEmployee(employeeId: string): Promise<CommissionRecord[]> {
    return Array.from(this.commissionRecords.values()).filter(record => record.employeeId === employeeId);
  }

  async createCommissionRecord(record: Omit<CommissionRecord, 'id' | 'createdAt'>): Promise<CommissionRecord> {
    const id = randomUUID();
    const commissionRecord: CommissionRecord = {
      ...record,
      id,
      createdAt: new Date()
    };
    this.commissionRecords.set(id, commissionRecord);
    return commissionRecord;
  }
}

export const storage = new MemStorage();
