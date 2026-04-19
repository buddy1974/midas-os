import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { events, eventRegistrations } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, id));

    return NextResponse.json({
      event,
      registrations,
      count: registrations.length,
    });
  } catch (err) {
    console.error("[GET /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = getDb();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.description === "string") updateData.description = body.description || null;
    if (typeof body.event_type === "string") updateData.eventType = body.event_type;
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.location === "string") updateData.location = body.location || null;
    if (typeof body.zoom_link === "string") updateData.zoomLink = body.zoom_link || null;
    if (typeof body.event_date === "string" && body.event_date) {
      updateData.eventDate = new Date(body.event_date);
    }
    if (typeof body.end_time === "string") {
      updateData.endTime = body.end_time ? new Date(body.end_time) : null;
    }
    if (typeof body.max_capacity === "number") updateData.maxCapacity = body.max_capacity;
    if (typeof body.price_pence === "number") updateData.pricePence = body.price_pence;
    if (typeof body.ticket_link === "string") updateData.ticketLink = body.ticket_link || null;
    if (typeof body.lot_id === "string") updateData.lotId = body.lot_id || null;
    if (typeof body.social_post_generated === "boolean") updateData.socialPostGenerated = body.social_post_generated;
    if (typeof body.email_sent === "boolean") updateData.emailSent = body.email_sent;
    if (typeof body.showOnWebsite === "boolean") updateData.showOnWebsite = body.showOnWebsite;
    if (typeof body.cover_image === "string") updateData.coverImage = body.cover_image || null;

    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [event] = await db
      .select({ status: events.status })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "upcoming" || event.status === "live") {
      return NextResponse.json(
        { error: "Cannot delete an upcoming or live event" },
        { status: 400 }
      );
    }

    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, id));
    await db.delete(events).where(eq(events.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
