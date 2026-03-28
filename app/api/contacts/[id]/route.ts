import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const updates: Partial<typeof contacts.$inferInsert> = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.email === "string") updates.email = body.email.trim() || null;
    if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
    if (typeof body.contact_type === "string") updates.contactType = body.contact_type;
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.score === "number") updates.score = Math.min(100, Math.max(0, body.score));
    if (typeof body.budget_min === "number") updates.budgetMin = body.budget_min;
    if (typeof body.budget_max === "number") updates.budgetMax = body.budget_max;
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/contacts/[id]]", err);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(contacts).where(eq(contacts.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/contacts/[id]]", err);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
