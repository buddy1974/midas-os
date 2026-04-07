import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { events, eventRegistrations } from "@/lib/schema";
import { eq, and, asc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";

  try {
    const db = getDb();
    const conditions = [];
    if (status) conditions.push(eq(events.status, status));
    if (type) conditions.push(eq(events.eventType, type));

    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        status: events.status,
        location: events.location,
        zoomLink: events.zoomLink,
        eventDate: events.eventDate,
        endTime: events.endTime,
        maxCapacity: events.maxCapacity,
        pricePence: events.pricePence,
        ticketLink: events.ticketLink,
        lotId: events.lotId,
        socialPostGenerated: events.socialPostGenerated,
        emailSent: events.emailSent,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        registrantCount: count(eventRegistrations.id),
      })
      .from(events)
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(events.id)
      .orderBy(asc(events.eventDate));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const eventDateRaw = typeof body.event_date === "string" ? body.event_date : "";
    if (!eventDateRaw) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 });
    }
    const eventDate = new Date(eventDateRaw);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: "event_date is invalid" }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(events)
      .values({
        title,
        description: typeof body.description === "string" ? body.description || null : null,
        eventType: typeof body.event_type === "string" ? body.event_type : "webinar",
        status: typeof body.status === "string" ? body.status : "upcoming",
        location: typeof body.location === "string" ? body.location || null : null,
        zoomLink: typeof body.zoom_link === "string" ? body.zoom_link || null : null,
        eventDate,
        endTime:
          typeof body.end_time === "string" && body.end_time
            ? new Date(body.end_time)
            : null,
        maxCapacity:
          typeof body.max_capacity === "number" ? body.max_capacity : null,
        pricePence: typeof body.price_pence === "number" ? body.price_pence : 0,
        ticketLink: typeof body.ticket_link === "string" ? body.ticket_link || null : null,
        lotId: typeof body.lot_id === "string" ? body.lot_id || null : null,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
