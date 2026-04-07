CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" uuid,
	"platform" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"hashtags" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"tone" varchar(20) DEFAULT 'professional' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
