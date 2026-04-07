import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { eventRegistrations } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() ?? "";

  try {
    const db = getDb();
    const conditions = [eq(eventRegistrations.eventId, id)];
    if (status) conditions.push(eq(eventRegistrations.status, status));

    const rows = await db
      .select()
      .from(eventRegistrations)
      .where(and(...conditions));

    const [totalRow] = await db
      .select({ c: count() })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, id));

    return NextResponse.json({
      registrations: rows,
      total: Number(totalRow.c),
    });
  } catch (err) {
    console.error("[GET /api/events/[id]/registrations]", err);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // consume params
  try {
    const body = await req.json() as Record<string, unknown>;
    const registrationId = typeof body.registrationId === "string" ? body.registrationId : "";
    const newStatus = typeof body.status === "string" ? body.status : "";

    if (!registrationId || !newStatus) {
      return NextResponse.json({ error: "registrationId and status are required" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(eventRegistrations)
      .set({ status: newStatus })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/events/[id]/registrations]", err);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
