import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("member").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const lots = pgTable("lots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  guidePrice: integer("guide_price").notNull(),
  arv: integer("arv"),
  bedrooms: integer("bedrooms"),
  propertyType: varchar("property_type", { length: 50 }),
  pipelineStage: varchar("pipeline_stage", { length: 30 }).default("sourcing").notNull(),
  soldPrice: integer("sold_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  contactType: varchar("contact_type", { length: 30 }),
  score: integer("score").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("cold").notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type", { length: 50 }),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: varchar("subject", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(),
  segment: varchar("segment", { length: 100 }).notNull(),
  recipientCount: integer("recipient_count").default(0).notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  openRate: numeric("open_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  clickRate: numeric("click_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  resendMessageId: varchar("resend_message_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Type exports
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Lot = InferSelectModel<typeof lots>;
export type NewLot = InferInsertModel<typeof lots>;

export type Contact = InferSelectModel<typeof contacts>;
export type NewContact = InferInsertModel<typeof contacts>;

export type ActivityLog = InferSelectModel<typeof activityLog>;
export type NewActivityLog = InferInsertModel<typeof activityLog>;

export type Campaign = InferSelectModel<typeof campaigns>;
export type NewCampaign = InferInsertModel<typeof campaigns>;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 200 }).unique().notNull(),
  name: varchar("name", { length: 100 }),
  status: varchar("status", { length: 20 }).default("confirmed").notNull(),
  token: varchar("token", { length: 64 }).notNull(),
  source: varchar("source", { length: 100 }),
  investorType: varchar("investor_type", { length: 50 }),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const newsletterSends = pgTable("newsletter_sends", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: varchar("subject", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 50 }),
  segment: varchar("segment", { length: 100 }),
  recipientCount: integer("recipient_count").default(0),
  openRate: numeric("open_rate").default("0"),
  clickRate: numeric("click_rate").default("0"),
  resendMessageId: varchar("resend_message_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("sent"),
  sentAt: timestamp("sent_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const newsletterDrafts = pgTable("newsletter_drafts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: varchar("subject", { length: 255 }),
  previewText: varchar("preview_text", { length: 300 }),
  templateType: varchar("template_type", { length: 50 }),
  lotIds: text("lot_ids"),
  htmlBody: text("html_body"),
  status: varchar("status", { length: 20 }).default("draft"),
  recipientCount: integer("recipient_count").default(0),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type NewsletterSubscriber = InferSelectModel<typeof newsletterSubscribers>;
export type NewNewsletterSubscriber = InferInsertModel<typeof newsletterSubscribers>;

export type NewsletterSend = InferSelectModel<typeof newsletterSends>;
export type NewNewsletterSend = InferInsertModel<typeof newsletterSends>;

export type NewsletterDraft = InferSelectModel<typeof newsletterDrafts>;
export type NewNewsletterDraft = InferInsertModel<typeof newsletterDrafts>;

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: uuid("lot_id"),
  platform: varchar("platform", { length: 20 }).notNull(),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  tone: varchar("tone", { length: 20 }).default("professional").notNull(),
  generatedAt: timestamp("generated_at").default(sql`now()`).notNull(),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type SocialPost = InferSelectModel<typeof socialPosts>;
export type NewSocialPost = InferInsertModel<typeof socialPosts>;
