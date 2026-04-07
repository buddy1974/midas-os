import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { viewings, lots, contacts } from "@/lib/schema";
import { eq, and, between, asc } from "drizzle-orm";

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function buildConfirmationHtml(params: {
  contactName: string;
  address: string;
  viewingDate: Date;
  durationMinutes: number;
  calendarUrl: string;
}): string {
  const { contactName, address, viewingDate, durationMinutes, calendarUrl } = params;
  const dateStr = viewingDate.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = viewingDate.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
  const gold = "#c9a84c";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
<div style="max-width:580px;margin:0 auto;background:#0a0a0a;">
  <div style="background:#000;padding:28px 36px;text-align:center;border-bottom:2px solid ${gold};">
    <h1 style="color:${gold};font-size:28px;letter-spacing:6px;text-transform:uppercase;margin:0 0 4px 0;">MIDAS</h1>
    <p style="color:#555;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;">PROPERTY AUCTIONS</p>
  </div>
  <div style="padding:32px 36px;">
    <p style="color:#22c55e;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">✓ Viewing Confirmed</p>
    <p style="color:#e0e0e0;font-size:15px;margin-bottom:24px;">Dear ${contactName},</p>
    <p style="color:#c0c0c0;font-size:15px;line-height:1.7;margin-bottom:24px;">
      Your viewing has been confirmed. Here are the details:
    </p>
    <div style="background:#111;border:1px solid #1a1a1a;border-left:3px solid ${gold};border-radius:6px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Property</p>
      <p style="color:#e0e0e0;font-size:16px;font-weight:bold;margin-bottom:16px;">${address}</p>
      <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Date &amp; Time</p>
      <p style="color:${gold};font-size:15px;font-weight:bold;margin-bottom:16px;">${dateStr} at ${timeStr}</p>
      <p style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Duration</p>
      <p style="color:#c0c0c0;font-size:14px;margin-bottom:0;">${durationMinutes} minutes</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${calendarUrl}" style="background:${gold};color:#000;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;display:inline-block;">
        + Add to Google Calendar
      </a>
    </div>
    <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#888;font-size:12px;margin-bottom:6px;">📋 <strong style="color:#c0c0c0;">Legal Pack:</strong> Download before your viewing to make the most of your time on-site.</p>
      <p style="color:#888;font-size:12px;margin-bottom:0;">📱 <strong style="color:#c0c0c0;">Questions?</strong> WhatsApp Sam directly: <strong style="color:${gold};">07454 753318</strong></p>
    </div>
    <div style="padding-top:20px;border-top:1px solid #1a1a1a;">
      <p style="color:#e0e0e0;font-weight:bold;font-size:13px;margin-bottom:2px;">Sam Fongho</p>
      <p style="color:#888;font-size:12px;margin-bottom:2px;">Midas Property Auctions</p>
      <p style="color:#888;font-size:12px;margin-bottom:2px;">📱 07454 753318</p>
      <p style="color:#888;font-size:12px;">✉ Sam@MidasPropertyAuctions.co.uk</p>
    </div>
  </div>
  <div style="background:#050505;padding:20px 36px;text-align:center;border-top:1px solid #111;">
    <p style="color:#333;font-size:10px;line-height:1.6;margin:0;">
      Midas Property Group · Stanmore Business &amp; Innovation Centre, Stanmore, London HA7 1BT
    </p>
  </div>
</div>
</body>
</html>`;
}

function buildCalendarUrl(params: {
  address: string;
  viewingDate: Date;
  durationMinutes: number;
}): string {
  const { address, viewingDate, durationMinutes } = params;
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const endDate = new Date(viewingDate.getTime() + durationMinutes * 60000);
  const params2 = new URLSearchParams({
    action: "TEMPLATE",
    text: `Property Viewing — ${address}`,
    dates: `${fmt(viewingDate)}/${fmt(endDate)}`,
    details: `Viewing arranged by Midas Property Auctions. Contact Sam: 07454 753318`,
    location: address,
  });
  return `https://calendar.google.com/calendar/render?${params2.toString()}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get("lot_id")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const dateParam = searchParams.get("date")?.trim() ?? "";

  try {
    const db = getDb();
    const conditions = [];
    if (lotId) conditions.push(eq(viewings.lotId, lotId));
    if (status) conditions.push(eq(viewings.status, status));
    if (dateParam) {
      const dayStart = new Date(dateParam + "T00:00:00Z");
      const dayEnd = new Date(dateParam + "T23:59:59Z");
      conditions.push(between(viewings.viewingDate, dayStart, dayEnd));
    }

    const rows = await db
      .select({
        id: viewings.id,
        lotId: viewings.lotId,
        contactName: viewings.contactName,
        contactEmail: viewings.contactEmail,
        contactPhone: viewings.contactPhone,
        viewingDate: viewings.viewingDate,
        durationMinutes: viewings.durationMinutes,
        status: viewings.status,
        notes: viewings.notes,
        confirmationSent: viewings.confirmationSent,
        reminderSent: viewings.reminderSent,
        createdAt: viewings.createdAt,
        lotAddress: lots.address,
        lotGuidePrice: lots.guidePrice,
      })
      .from(viewings)
      .leftJoin(lots, eq(viewings.lotId, lots.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(viewings.viewingDate));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/viewings]", err);
    return NextResponse.json({ error: "Failed to fetch viewings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const lotId = typeof body.lot_id === "string" ? body.lot_id.trim() : "";
    const contactName = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
    const contactEmail = typeof body.contact_email === "string" ? body.contact_email.trim().toLowerCase() : "";
    const viewingDateRaw = typeof body.viewing_date === "string" ? body.viewing_date : "";

    if (!lotId || !contactName || !contactEmail || !viewingDateRaw) {
      return NextResponse.json({ error: "lot_id, contact_name, contact_email, and viewing_date are required" }, { status: 400 });
    }
    if (!isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const viewingDate = new Date(viewingDateRaw);
    if (isNaN(viewingDate.getTime())) {
      return NextResponse.json({ error: "Invalid viewing_date" }, { status: 400 });
    }

    const durationMinutes = typeof body.duration_minutes === "number" ? body.duration_minutes : 30;
    const db = getDb();

    // Fetch lot for address
    const [lot] = await db.select().from(lots).where(eq(lots.id, lotId)).limit(1);
    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Conflict check: any viewing within ±30 min on same lot
    const windowStart = new Date(viewingDate.getTime() - 30 * 60000);
    const windowEnd = new Date(viewingDate.getTime() + 30 * 60000);
    const [conflict] = await db
      .select({ id: viewings.id })
      .from(viewings)
      .where(
        and(
          eq(viewings.lotId, lotId),
          between(viewings.viewingDate, windowStart, windowEnd),
          eq(viewings.status, "scheduled")
        )
      )
      .limit(1);

    if (conflict) {
      return NextResponse.json(
        {
          error: "Slot taken",
          message: "A viewing is already booked within 30 minutes of this time for this property",
        },
        { status: 400 }
      );
    }

    // Insert
    const [inserted] = await db
      .insert(viewings)
      .values({
        lotId,
        contactName,
        contactEmail,
        contactPhone: typeof body.contact_phone === "string" ? body.contact_phone.trim() || null : null,
        viewingDate,
        durationMinutes,
        status: "scheduled",
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        confirmationSent: false,
      })
      .returning();

    // Auto-add to contacts
    await db
      .insert(contacts)
      .values({
        name: contactName,
        email: contactEmail,
        phone: typeof body.contact_phone === "string" ? body.contact_phone.trim() || null : null,
        contactType: "lead",
        score: 40,
        status: "warm",
        notes: `Booked viewing: ${lot.address}`,
      })
      .onConflictDoNothing();

    // Send confirmation email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && inserted) {
      const calendarUrl = buildCalendarUrl({ address: lot.address, viewingDate, durationMinutes });
      const html = buildConfirmationHtml({
        contactName,
        address: lot.address,
        viewingDate,
        durationMinutes,
        calendarUrl,
      });

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Midas Property Auctions <sam@midaspropertyauctions.co.uk>",
          to: [contactEmail],
          subject: `Viewing Confirmed — ${lot.address}`,
          html,
        }),
      });

      if (emailRes.ok) {
        await db
          .update(viewings)
          .set({ confirmationSent: true })
          .where(eq(viewings.id, inserted.id));
        inserted.confirmationSent = true;
      }
    }

    return NextResponse.json({ ...inserted, lotAddress: lot.address }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/viewings]", err);
    return NextResponse.json({ error: "Failed to book viewing" }, { status: 500 });
  }
}
