import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/schema";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const db = getDb();

    await db
      .insert(newsletterSubscribers)
      .values({
        email,
        name: typeof body.name === "string" ? body.name.trim() || null : null,
        status: "confirmed",
        token,
        source: typeof body.source === "string" ? body.source : "website",
        investorType: typeof body.investor_type === "string" ? body.investor_type : null,
        confirmedAt: new Date(),
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/newsletter/subscribe]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
