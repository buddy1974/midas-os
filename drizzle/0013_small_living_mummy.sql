CREATE TABLE "content_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" varchar(100) NOT NULL,
	"previous_value" text,
	"new_value" text,
	"changed_by" varchar(100),
	"label" varchar(200),
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "full_description" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "current_registrations" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cost_type" varchar(20) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cost_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "external_ticket_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "eventbrite_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "thumbnail_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "video_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recap_video_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "custom_buttons" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "confirmation_message" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "bathrooms" integer;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "floor_area" varchar(100);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "tenure" varchar(30);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "auction_date" timestamp;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "key_features" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "floor_plan_url" varchar(500);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "legal_pack_url" varchar(500);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "address_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "address_line1" varchar(200);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "address_line2" varchar(200);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "area" varchar(100);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "video_url" varchar(500);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "virtual_tour_url" varchar(500);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "vendor_name" varchar(100);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "vendor_email" varchar(255);