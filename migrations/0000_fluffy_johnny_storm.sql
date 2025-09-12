CREATE TYPE "public"."billing_cycle" AS ENUM('one-time', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."letter_status" AS ENUM('requested', 'reviewing', 'completed', 'downloaded');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('user', 'employee', 'admin');--> statement-breakpoint
CREATE TABLE "commission_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"points_earned" integer DEFAULT 1,
	"commission_rate" numeric(4, 3) NOT NULL,
	"status" text DEFAULT 'pending',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"discount_code" text NOT NULL,
	"total_commission" numeric(10, 2) DEFAULT '0.00',
	"total_points" integer DEFAULT 0,
	"commission_rate" numeric(4, 3) DEFAULT '0.05',
	"discount_percentage" integer DEFAULT 20,
	"is_active" boolean DEFAULT true,
	"performance_tier" text DEFAULT 'bronze',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_discount_code_unique" UNIQUE("discount_code")
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"sender_name" text NOT NULL,
	"sender_address" jsonb NOT NULL,
	"sender_firm_name" text,
	"recipient_name" text NOT NULL,
	"recipient_address" jsonb NOT NULL,
	"subject" text NOT NULL,
	"conflict_description" text NOT NULL,
	"desired_resolution" text NOT NULL,
	"additional_notes" text,
	"ai_prompt" text,
	"ai_generated_content" text,
	"attorney_notes" text,
	"final_content" text,
	"status" "letter_status" DEFAULT 'requested',
	"pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	"ai_generated_at" timestamp,
	"reviewed_at" timestamp,
	"completed_at" timestamp,
	"downloaded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"letter_count" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"is_active" boolean DEFAULT true,
	"features" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"discount_code_used" text,
	"original_price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00',
	"final_price" numeric(10, 2) NOT NULL,
	"letters_remaining" integer NOT NULL,
	"letters_used" integer DEFAULT 0,
	"status" "subscription_status" DEFAULT 'active',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"user_type" "user_type" DEFAULT 'user' NOT NULL,
	"phone" text,
	"company_name" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_discount_code_used_employees_discount_code_fk" FOREIGN KEY ("discount_code_used") REFERENCES "public"."employees"("discount_code") ON DELETE no action ON UPDATE no action;