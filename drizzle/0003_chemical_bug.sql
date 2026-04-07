CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"investor_type" varchar(50),
	"source" varchar(100) DEFAULT 'direct' NOT NULL,
	"status" varchar(20) DEFAULT 'registered' NOT NULL,
	"notes" text,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" varchar(50) DEFAULT 'webinar' NOT NULL,
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"location" varchar(255),
	"zoom_link" varchar(500),
	"event_date" timestamp NOT NULL,
	"end_time" timestamp,
	"max_capacity" integer,
	"price_pence" integer DEFAULT 0,
	"ticket_link" varchar(500),
	"lot_id" uuid,
	"social_post_generated" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
