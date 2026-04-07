import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterDrafts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (typeof body.subject === "string") updateData.subject = body.subject;
    if (typeof body.preview_text === "string") updateData.previewText = body.preview_text;
    if (typeof body.template_type === "string") updateData.templateType = body.template_type;
    if (typeof body.lot_ids === "string") updateData.lotIds = body.lot_ids;
    if (typeof body.html_body === "string") updateData.htmlBody = body.html_body;
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.recipient_count === "number") updateData.recipientCount = body.recipient_count;
    if (body.scheduled_at instanceof Date || typeof body.scheduled_at === "string") {
      updateData.scheduledAt = new Date(body.scheduled_at as string);
    }
    if (body.sent_at instanceof Date || typeof body.sent_at === "string") {
      updateData.sentAt = new Date(body.sent_at as string);
    }

    const [updated] = await db
      .update(newsletterDrafts)
      .set(updateData)
      .where(eq(newsletterDrafts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/newsletter/drafts/[id]]", err);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [deleted] = await db
      .delete(newsletterDrafts)
      .where(and(eq(newsletterDrafts.id, id), eq(newsletterDrafts.status, "draft")))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Draft not found or cannot be deleted" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/newsletter/drafts/[id]]", err);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
