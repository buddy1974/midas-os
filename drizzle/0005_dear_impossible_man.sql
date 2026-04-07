CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"context_used" varchar(50) DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lender_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lender_id" uuid NOT NULL,
	"lot_id" uuid,
	"borrower_name" varchar(100),
	"borrower_email" varchar(255),
	"loan_amount_pence" integer NOT NULL,
	"property_value_pence" integer,
	"ltv" numeric,
	"monthly_rate" numeric,
	"term_months" integer,
	"charge_type" varchar(20),
	"status" varchar(30) DEFAULT 'enquiry',
	"start_date" timestamp,
	"end_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"address" text NOT NULL,
	"property_type" varchar(50),
	"purchase_price_pence" integer,
	"current_value_pence" integer,
	"outstanding_mortgage_pence" integer DEFAULT 0,
	"monthly_rent_pence" integer DEFAULT 0,
	"monthly_mortgage_pence" integer DEFAULT 0,
	"monthly_costs_pence" integer DEFAULT 0,
	"purchase_date" timestamp,
	"bedrooms" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"owner_name" varchar(100) NOT NULL,
	"owner_email" varchar(255),
	"portfolio_name" varchar(150),
	"strategy" varchar(50) DEFAULT 'btl',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_lenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"company" varchar(150),
	"lender_type" varchar(50) DEFAULT 'individual',
	"max_loan_pence" integer,
	"min_loan_pence" integer,
	"max_ltv" integer,
	"monthly_rate" numeric,
	"charge_types" varchar(100),
	"specialisms" text,
	"status" varchar(20) DEFAULT 'active',
	"notes" text,
	"last_deal_date" timestamp,
	"total_deals" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
