CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category" varchar(50),
	"tags" text,
	"content" text,
	"excerpt" text,
	"cover_image" varchar(500),
	"gradient" varchar(100) DEFAULT 'from-blue-900 to-[#080809]',
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"author" varchar(100) DEFAULT 'Midas Property Auctions',
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"location" varchar(150),
	"text" text NOT NULL,
	"rating" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"source" varchar(50) DEFAULT 'direct',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"key" varchar(200) PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"label" varchar(200),
	"field_type" varchar(20) DEFAULT 'text',
	"sort_order" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(100),
	"initials" varchar(4),
	"bio" text,
	"phone" varchar(30),
	"email" varchar(255),
	"linkedin" varchar(500),
	"photo_url" varchar(500),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"show_on_website" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
