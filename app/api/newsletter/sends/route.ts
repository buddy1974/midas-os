import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { newsletterSends } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const sends = await db
      .select()
      .from(newsletterSends)
      .orderBy(desc(newsletterSends.createdAt))
      .limit(10);
    return NextResponse.json(sends);
  } catch (err) {
    console.error("[GET /api/newsletter/sends]", err);
    return NextResponse.json({ error: "Failed to fetch sends" }, { status: 500 });
  }
}
