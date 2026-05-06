ALTER TABLE "events" ADD COLUMN "registration_type" varchar(20) DEFAULT 'form' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "form_fields" varchar(20) DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "show_investor_option" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "custom_button_label" varchar(100);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "custom_button_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recap_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;