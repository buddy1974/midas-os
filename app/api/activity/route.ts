import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { activityLog } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(10);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/activity]", err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
