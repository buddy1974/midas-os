import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatMessages } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(asc(chatMessages.createdAt))
      .limit(50);

    return NextResponse.json(messages);
  } catch (err) {
    console.error("[GET /api/assistant/history]", err);
    return NextResponse.json([]);
  }
}
