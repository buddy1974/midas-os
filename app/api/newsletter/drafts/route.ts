import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterDrafts } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const drafts = await db
      .select()
      .from(newsletterDrafts)
      .orderBy(desc(newsletterDrafts.createdAt));
    return NextResponse.json(drafts);
  } catch (err) {
    console.error("[GET /api/newsletter/drafts]", err);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const [inserted] = await db
      .insert(newsletterDrafts)
      .values({
        subject: typeof body.subject === "string" ? body.subject : null,
        previewText: typeof body.preview_text === "string" ? body.preview_text : null,
        templateType: typeof body.template_type === "string" ? body.template_type : null,
        lotIds: typeof body.lot_ids === "string" ? body.lot_ids : null,
        htmlBody: typeof body.html_body === "string" ? body.html_body : null,
        status: "draft",
        recipientCount: typeof body.recipient_count === "number" ? body.recipient_count : 0,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/newsletter/drafts]", err);
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
