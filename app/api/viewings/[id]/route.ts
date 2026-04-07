import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { viewings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.notes === "string") updateData.notes = body.notes || null;
    if (typeof body.viewing_date === "string" && body.viewing_date) {
      updateData.viewingDate = new Date(body.viewing_date);
    }
    if (typeof body.confirmation_sent === "boolean") updateData.confirmationSent = body.confirmation_sent;

    const [updated] = await db
      .update(viewings)
      .set(updateData)
      .where(eq(viewings.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Viewing not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/viewings/[id]]", err);
    return NextResponse.json({ error: "Failed to update viewing" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [viewing] = await db
      .select({ status: viewings.status })
      .from(viewings)
      .where(eq(viewings.id, id))
      .limit(1);

    if (!viewing) {
      return NextResponse.json({ error: "Viewing not found" }, { status: 404 });
    }
    if (viewing.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled viewings can be deleted" },
        { status: 400 }
      );
    }

    await db.delete(viewings).where(eq(viewings.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/viewings/[id]]", err);
    return NextResponse.json({ error: "Failed to delete viewing" }, { status: 500 });
  }
}
