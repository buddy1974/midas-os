import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  numeric,
  boolean,
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
  coverImage: varchar("cover_image", { length: 500 }),
  images: text("images").default("[]"),
  showOnWebsite: boolean("show_on_website").default(false).notNull(),
  isOffMarket: boolean("is_off_market").default(false).notNull(),
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
  headerImage: varchar("header_image", { length: 500 }),
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

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).default("webinar").notNull(),
  status: varchar("status", { length: 20 }).default("upcoming").notNull(),
  location: varchar("location", { length: 255 }),
  zoomLink: varchar("zoom_link", { length: 500 }),
  eventDate: timestamp("event_date").notNull(),
  endTime: timestamp("end_time"),
  maxCapacity: integer("max_capacity"),
  pricePence: integer("price_pence").default(0),
  ticketLink: varchar("ticket_link", { length: 500 }),
  lotId: uuid("lot_id"),
  coverImage: varchar("cover_image", { length: 500 }),
  images: text("images").default("[]"),
  socialPostGenerated: boolean("social_post_generated").default(false).notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  showOnWebsite: boolean("show_on_website").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  investorType: varchar("investor_type", { length: 50 }),
  source: varchar("source", { length: 100 }).default("direct").notNull(),
  status: varchar("status", { length: 20 }).default("registered").notNull(),
  notes: text("notes"),
  registeredAt: timestamp("registered_at").default(sql`now()`).notNull(),
});

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export type EventRegistration = InferSelectModel<typeof eventRegistrations>;
export type NewEventRegistration = InferInsertModel<typeof eventRegistrations>;

export const viewings = pgTable("viewings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: uuid("lot_id").notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }),
  viewingDate: timestamp("viewing_date").notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(),
  notes: text("notes"),
  confirmationSent: boolean("confirmation_sent").default(false).notNull(),
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type Viewing = InferSelectModel<typeof viewings>;
export type NewViewing = InferInsertModel<typeof viewings>;

export const privateLenders = pgTable("private_lenders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  company: varchar("company", { length: 150 }),
  lenderType: varchar("lender_type", { length: 50 }).default("individual"),
  maxLoanPence: integer("max_loan_pence"),
  minLoanPence: integer("min_loan_pence"),
  maxLtv: integer("max_ltv"),
  monthlyRate: numeric("monthly_rate"),
  chargeTypes: varchar("charge_types", { length: 100 }),
  specialisms: text("specialisms"),
  status: varchar("status", { length: 20 }).default("active"),
  notes: text("notes"),
  lastDealDate: timestamp("last_deal_date"),
  totalDeals: integer("total_deals").default(0),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const lenderDeals = pgTable("lender_deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lenderId: uuid("lender_id").notNull(),
  lotId: uuid("lot_id"),
  borrowerName: varchar("borrower_name", { length: 100 }),
  borrowerEmail: varchar("borrower_email", { length: 255 }),
  loanAmountPence: integer("loan_amount_pence").notNull(),
  propertyValuePence: integer("property_value_pence"),
  ltv: numeric("ltv"),
  monthlyRate: numeric("monthly_rate"),
  termMonths: integer("term_months"),
  chargeType: varchar("charge_type", { length: 20 }),
  status: varchar("status", { length: 30 }).default("enquiry"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: uuid("contact_id"),
  ownerName: varchar("owner_name", { length: 100 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }),
  portfolioName: varchar("portfolio_name", { length: 150 }),
  strategy: varchar("strategy", { length: 50 }).default("btl"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const portfolioProperties = pgTable("portfolio_properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: uuid("portfolio_id").notNull(),
  address: text("address").notNull(),
  propertyType: varchar("property_type", { length: 50 }),
  purchasePricePence: integer("purchase_price_pence"),
  currentValuePence: integer("current_value_pence"),
  outstandingMortgagePence: integer("outstanding_mortgage_pence").default(0),
  monthlyRentPence: integer("monthly_rent_pence").default(0),
  monthlyMortgagePence: integer("monthly_mortgage_pence").default(0),
  monthlyCostsPence: integer("monthly_costs_pence").default(0),
  purchaseDate: timestamp("purchase_date"),
  bedrooms: integer("bedrooms"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  contextUsed: varchar("context_used", { length: 50 }).default("general"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type PrivateLender = InferSelectModel<typeof privateLenders>;
export type NewPrivateLender = InferInsertModel<typeof privateLenders>;

export type LenderDeal = InferSelectModel<typeof lenderDeals>;
export type NewLenderDeal = InferInsertModel<typeof lenderDeals>;

export type Portfolio = InferSelectModel<typeof portfolios>;
export type NewPortfolio = InferInsertModel<typeof portfolios>;

export type PortfolioProperty = InferSelectModel<typeof portfolioProperties>;
export type NewPortfolioProperty = InferInsertModel<typeof portfolioProperties>;

export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type NewChatMessage = InferInsertModel<typeof chatMessages>;

// ─── Loan Applications ──────────────────────────────────────────────────────

export const loanApplications = pgTable("loan_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  // Loan details
  loanType: varchar("loan_type", { length: 20 }).default("bridging"),
  loanPurpose: varchar("loan_purpose", { length: 20 }),
  loanAmountPence: integer("loan_amount_pence").notNull(),
  loanTermMonths: integer("loan_term_months").notNull(),
  monthlyRate: numeric("monthly_rate").default("0.85"),
  repaymentMethod: varchar("repayment_method", { length: 20 }).default("sale"),

  // Property security
  propertyAddress: text("property_address").notNull(),
  propertyType: varchar("property_type", { length: 50 }),
  propertyStatus: varchar("property_status", { length: 20 }),
  propertyValuePence: integer("property_value_pence"),
  purchasePricePence: integer("purchase_price_pence"),
  chargeType: varchar("charge_type", { length: 20 }).default("first"),
  estimatedRentalPence: integer("estimated_rental_pence"),

  // Applicant
  applicantType: varchar("applicant_type", { length: 20 }).default("personal"),
  applicantName: varchar("applicant_name", { length: 100 }).notNull(),
  applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 30 }),
  companyName: varchar("company_name", { length: 150 }),

  // Financial background flags
  refusedMortgage: boolean("refused_mortgage").default(false),
  hasCcj: boolean("has_ccj").default(false),
  hasBankruptcy: boolean("has_bankruptcy").default(false),
  missedPayments: boolean("missed_payments").default(false),
  hasArrears: boolean("has_arrears").default(false),

  // AI scoring
  aiScore: integer("ai_score"),
  aiVerdict: varchar("ai_verdict", { length: 30 }),
  aiRisk: varchar("ai_risk", { length: 20 }),
  aiSummary: text("ai_summary"),
  ltv: numeric("ltv"),

  // Pipeline status
  status: varchar("status", { length: 30 }).default("enquiry"),

  // Admin
  notes: text("notes"),
  brokerName: varchar("broker_name", { length: 100 }),
  brokerEmail: varchar("broker_email", { length: 255 }),
  assignedTo: varchar("assigned_to", { length: 100 }),
  source: varchar("source", { length: 50 }).default("website"),
  facilityLetterSent: boolean("facility_letter_sent").default(false),

  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const loanRepayments = pgTable("loan_repayments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").notNull(),
  monthNumber: integer("month_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amountPence: integer("amount_pence").notNull(),
  paid: boolean("paid").default(false),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const loanDocuments = pgTable("loan_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 100 }),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export type LoanApplication = InferSelectModel<typeof loanApplications>;
export type NewLoanApplication = InferInsertModel<typeof loanApplications>;

export type LoanRepayment = InferSelectModel<typeof loanRepayments>;
export type NewLoanRepayment = InferInsertModel<typeof loanRepayments>;

export type LoanDocument = InferSelectModel<typeof loanDocuments>;
export type NewLoanDocument = InferInsertModel<typeof loanDocuments>;

// ─── CMS: Site Config ────────────────────────────────────────────────────────

export const siteConfig = pgTable("site_config", {
  key: varchar("key", { length: 200 }).primaryKey(),
  value: text("value").notNull().default(""),
  category: varchar("category", { length: 50 }).default("general"),
  label: varchar("label", { length: 200 }),
  fieldType: varchar("field_type", { length: 20 }).default("text"),
  sortOrder: integer("sort_order").default(0),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export type SiteConfig = InferSelectModel<typeof siteConfig>;
export type NewSiteConfig = InferInsertModel<typeof siteConfig>;

// ─── CMS: Team Members ───────────────────────────────────────────────────────

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }),
  initials: varchar("initials", { length: 4 }),
  bio: text("bio"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  linkedin: varchar("linkedin", { length: 500 }),
  photoUrl: varchar("photo_url", { length: 500 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  showOnWebsite: boolean("show_on_website").default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

// ─── CMS: Testimonials ───────────────────────────────────────────────────────

export const cmsTestimonials = pgTable("cms_testimonials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 150 }),
  text: text("text").notNull(),
  rating: integer("rating").default(5),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  source: varchar("source", { length: 50 }).default("direct"),
  photoUrl: varchar("photo_url", { length: 500 }),
  googleReviewUrl: varchar("google_review_url", { length: 500 }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export type CmsTestimonial = InferSelectModel<typeof cmsTestimonials>;
export type NewCmsTestimonial = InferInsertModel<typeof cmsTestimonials>;

// ─── CMS: Blog Posts ─────────────────────────────────────────────────────────

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 50 }),
  tags: text("tags"),
  content: text("content"),
  excerpt: text("excerpt"),
  coverImage: varchar("cover_image", { length: 500 }),
  gradient: varchar("gradient", { length: 100 }).default("from-blue-900 to-[#080809]"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  author: varchar("author", { length: 100 }).default("Midas Property Auctions"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  ogImage: varchar("og_image", { length: 500 }),
  ogTitle: varchar("og_title", { length: 255 }),
  keywords: text("keywords"),
  readingTime: integer("reading_time"),
  images: text("images"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type NewBlogPost = InferInsertModel<typeof blogPosts>;
