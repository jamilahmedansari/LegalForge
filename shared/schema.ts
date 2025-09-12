import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, decimal, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum('user_type', ['user', 'employee', 'admin']);
export const letterStatusEnum = pgEnum('letter_status', ['requested', 'reviewing', 'completed', 'downloaded']);
export const billingCycleEnum = pgEnum('billing_cycle', ['one-time', 'yearly']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'expired']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  userType: userTypeEnum("user_type").notNull().default('user'),
  phone: text("phone"),
  companyName: text("company_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Employees table
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  discountCode: text("discount_code").notNull().unique(),
  totalCommission: decimal("total_commission", { precision: 10, scale: 2 }).default('0.00'),
  totalPoints: integer("total_points").default(0),
  commissionRate: decimal("commission_rate", { precision: 4, scale: 3 }).default('0.05'),
  discountPercentage: integer("discount_percentage").default(20),
  isActive: boolean("is_active").default(true),
  performanceTier: text("performance_tier").default('bronze'),
  createdAt: timestamp("created_at").defaultNow()
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  letterCount: integer("letter_count").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  isActive: boolean("is_active").default(true),
  features: jsonb("features").default([]),
  createdAt: timestamp("created_at").defaultNow()
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  discountCodeUsed: text("discount_code_used").references(() => employees.discountCode),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0.00'),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  lettersRemaining: integer("letters_remaining").notNull(),
  lettersUsed: integer("letters_used").default(0),
  status: subscriptionStatusEnum("status").default('active'),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at")
});

// Letters table
export const letters = pgTable("letters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id),
  
  // Sender information
  senderName: text("sender_name").notNull(),
  senderAddress: jsonb("sender_address").notNull(),
  senderFirmName: text("sender_firm_name"),
  
  // Recipient information
  recipientName: text("recipient_name").notNull(),
  recipientAddress: jsonb("recipient_address").notNull(),
  
  // Letter content
  subject: text("subject").notNull(),
  conflictDescription: text("conflict_description").notNull(),
  desiredResolution: text("desired_resolution").notNull(),
  additionalNotes: text("additional_notes"),
  
  // AI and processing
  aiPrompt: text("ai_prompt"),
  aiGeneratedContent: text("ai_generated_content"),
  attorneyNotes: text("attorney_notes"),
  finalContent: text("final_content"),
  
  // Status tracking
  status: letterStatusEnum("status").default('requested'),
  pdfUrl: text("pdf_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  aiGeneratedAt: timestamp("ai_generated_at"),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
  downloadedAt: timestamp("downloaded_at")
});

// Commission records
export const commissionRecords = pgTable("commission_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  subscriptionId: uuid("subscription_id").notNull().references(() => userSubscriptions.id),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  pointsEarned: integer("points_earned").default(1),
  commissionRate: decimal("commission_rate", { precision: 4, scale: 3 }).notNull(),
  status: text("status").default('pending'),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Address schema
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().default('USA')
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  createdAt: true,
  totalCommission: true,
  totalPoints: true
});

export const insertLetterSchema = createInsertSchema(letters).omit({
  id: true,
  createdAt: true,
  aiGeneratedAt: true,
  reviewedAt: true,
  completedAt: true,
  downloadedAt: true
}).extend({
  senderAddress: addressSchema,
  recipientAddress: addressSchema
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  cancelledAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Letter = typeof letters.$inferSelect;
export type InsertLetter = z.infer<typeof insertLetterSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type Address = z.infer<typeof addressSchema>;
