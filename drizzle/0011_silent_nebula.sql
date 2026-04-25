ALTER TABLE "blog_posts" ADD COLUMN "og_image" varchar(500);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "og_title" varchar(255);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "reading_time" integer;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "images" text;--> statement-breakpoint
ALTER TABLE "cms_testimonials" ADD COLUMN "photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "cms_testimonials" ADD COLUMN "google_review_url" varchar(500);