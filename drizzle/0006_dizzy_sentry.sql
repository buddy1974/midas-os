ALTER TABLE "events" ADD COLUMN "cover_image" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "images" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "cover_image" varchar(500);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "images" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "newsletter_drafts" ADD COLUMN "header_image" varchar(500);