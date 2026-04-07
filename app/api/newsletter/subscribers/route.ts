import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/schema";
import { auth } from "@/auth";
import { desc, eq, ilike, or, and, count } from "drizzle-orm";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() ?? "";
  const investorType = searchParams.get("investor_type")?.trim() ?? "";
  const search = searchParams.get("search")?.trim() ?? "";

  try {
    const db = getDb();
    const conditions = [];

    if (status) conditions.push(eq(newsletterSubscribers.status, status));
    if (investorType) conditions.push(eq(newsletterSubscribers.investorType, investorType));
    if (search) {
      conditions.push(
        or(
          ilike(newsletterSubscribers.email, `%${search}%`),
          ilike(newsletterSubscribers.name, `%${search}%`)
        )
      );
    }

    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(newsletterSubscribers.createdAt));

    const [totalRow] = await db.select({ c: count() }).from(newsletterSubscribers);
    const [confirmedRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "confirmed"));
    const [unsubRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "unsubscribed"));

    return NextResponse.json({
      subscribers,
      counts: {
        total: Number(totalRow.c),
        confirmed: Number(confirmedRow.c),
        unsubscribed: Number(unsubRow.c),
      },
    });
  } catch (err) {
    console.error("[GET /api/newsletter/subscribers]", err);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
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

    const [inserted] = await db
      .insert(newsletterSubscribers)
      .values({
        email,
        name: typeof body.name === "string" ? body.name.trim() || null : null,
        status: "confirmed",
        token,
        source: typeof body.source === "string" ? body.source : "manual",
        investorType: typeof body.investor_type === "string" ? body.investor_type : null,
        confirmedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json(inserted ?? { success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/newsletter/subscribers]", err);
    return NextResponse.json({ error: "Failed to add subscriber" }, { status: 500 });
  }
}
