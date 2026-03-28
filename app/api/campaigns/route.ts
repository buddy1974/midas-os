import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { campaigns } from "@/lib/schema";
import type { NewCampaign } from "@/lib/schema";
import { desc } from "drizzle-orm";

const VALID_TEMPLATE_TYPES = [
  "auction_alert",
  "deal_spotlight",
  "event_invite",
  "legal_pack",
  "registration_close",
  "monthly_digest",
] as const;

type TemplateType = (typeof VALID_TEMPLATE_TYPES)[number];

function isValidTemplate(t: string): t is TemplateType {
  return (VALID_TEMPLATE_TYPES as readonly string[]).includes(t);
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/campaigns]", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const templateType =
      typeof body.template_type === "string" ? body.template_type : "";
    const segment = typeof body.segment === "string" ? body.segment.trim() : "";

    if (!subject || subject.length < 5) {
      return NextResponse.json(
        { error: "subject must be at least 5 characters" },
        { status: 400 }
      );
    }
    if (!isValidTemplate(templateType)) {
      return NextResponse.json(
        { error: `Invalid template_type. Valid: ${VALID_TEMPLATE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (!segment) {
      return NextResponse.json({ error: "segment is required" }, { status: 400 });
    }

    const newCampaign: NewCampaign = {
      subject,
      templateType,
      segment,
      recipientCount:
        typeof body.recipient_count === "number" ? body.recipient_count : 0,
      status: "draft",
    };

    const db = getDb();
    const [inserted] = await db.insert(campaigns).values(newCampaign).returning();
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/campaigns]", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
