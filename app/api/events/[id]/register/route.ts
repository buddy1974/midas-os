import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { events, eventRegistrations, newsletterSubscribers, contacts } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const db = getDb();

    // Fetch event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check capacity
    if (event.maxCapacity !== null) {
      const [{ c }] = await db
        .select({ c: count() })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, id));

      if (Number(c) >= event.maxCapacity) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
      }
    }

    // Check duplicate
    const [existing] = await db
      .select({ id: eventRegistrations.id })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, id),
          eq(eventRegistrations.email, email)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(eventRegistrations).values({
        eventId: id,
        name,
        email,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        investorType: typeof body.investor_type === "string" ? body.investor_type : null,
        source: typeof body.source === "string" ? body.source : "direct",
        status: "registered",
      });

      // Auto-add to newsletter_subscribers
      const token = crypto.randomUUID().replace(/-/g, "");
      await db
        .insert(newsletterSubscribers)
        .values({
          email,
          name,
          status: "confirmed",
          token,
          source: event.title.slice(0, 100),
          investorType: typeof body.investor_type === "string" ? body.investor_type : null,
          confirmedAt: new Date(),
        })
        .onConflictDoNothing();

      // Auto-add to contacts
      await db
        .insert(contacts)
        .values({
          name,
          email,
          phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
          contactType: "lead",
          score: 30,
          status: "cold",
          notes: `Registered for: ${event.title}`,
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      event: {
        title: event.title,
        date: event.eventDate,
        location: event.location,
      },
    });
  } catch (err) {
    console.error("[POST /api/events/[id]/register]", err);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
