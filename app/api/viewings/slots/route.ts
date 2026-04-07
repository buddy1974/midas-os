import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { viewings } from "@/lib/schema";
import { eq, and, between } from "drizzle-orm";

interface Slot {
  datetime: string;
  available: boolean;
  label: string;
  weekend: boolean;
}

function formatSlotLabel(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function generateDaySlots(date: Date): Date[] {
  const slots: Date[] = [];
  // 9:00 AM to 5:30 PM in 30-min increments (last slot 17:30, ends 18:00)
  for (let h = 9; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 17 && m > 30) continue;
      const slot = new Date(date);
      slot.setHours(h, m, 0, 0);
      slots.push(slot);
    }
  }
  return slots;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get("lot_id")?.trim() ?? "";
  const dateParam = searchParams.get("date")?.trim() ?? "";

  if (!lotId) {
    return NextResponse.json({ error: "lot_id is required" }, { status: 400 });
  }

  try {
    const db = getDb();

    // Determine date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDates: Date[] = [];
    if (dateParam) {
      const d = new Date(dateParam);
      d.setHours(0, 0, 0, 0);
      targetDates = [d];
    } else {
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        targetDates.push(d);
      }
    }

    // Fetch existing viewings for this lot in the date range
    const rangeStart = targetDates[0];
    const rangeEnd = new Date(targetDates[targetDates.length - 1]);
    rangeEnd.setHours(23, 59, 59, 999);

    const existingViewings = await db
      .select({ viewingDate: viewings.viewingDate, durationMinutes: viewings.durationMinutes })
      .from(viewings)
      .where(
        and(
          eq(viewings.lotId, lotId),
          between(viewings.viewingDate, rangeStart, rangeEnd)
        )
      );

    const bookedTimes = existingViewings.map((v) => new Date(v.viewingDate).getTime());

    const slots: Slot[] = [];
    for (const day of targetDates) {
      const daySlots = generateDaySlots(day);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      for (const slot of daySlots) {
        const slotTime = slot.getTime();
        // Conflict: within 30 min of any booked time
        const taken = bookedTimes.some((bt) => Math.abs(bt - slotTime) < 30 * 60000);
        // Past slots are unavailable
        const isPast = slotTime < Date.now();

        slots.push({
          datetime: slot.toISOString(),
          available: !taken && !isPast,
          label: formatSlotLabel(slot),
          weekend: isWeekend,
        });
      }
    }

    return NextResponse.json(slots);
  } catch (err) {
    console.error("[GET /api/viewings/slots]", err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
