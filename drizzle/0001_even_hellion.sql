CREATE TABLE "newsletter_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(255),
	"preview_text" varchar(300),
	"template_type" varchar(50),
	"lot_ids" text,
	"html_body" text,
	"status" varchar(20) DEFAULT 'draft',
	"recipient_count" integer DEFAULT 0,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(255) NOT NULL,
	"template_type" varchar(50),
	"segment" varchar(100),
	"recipient_count" integer DEFAULT 0,
	"open_rate" numeric DEFAULT '0',
	"click_rate" numeric DEFAULT '0',
	"resend_message_id" varchar(255),
	"status" varchar(20) DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(200) NOT NULL,
	"name" varchar(100),
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"token" varchar(64) NOT NULL,
	"source" varchar(100),
	"investor_type" varchar(50),
	"budget_min" integer,
	"budget_max" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
