import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatMessages } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { userMessage?: string; assistantMessage?: string };
    const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
    const assistantMessage = typeof body.assistantMessage === "string" ? body.assistantMessage.trim() : "";

    if (!userMessage || !assistantMessage) {
      return NextResponse.json({ error: "userMessage and assistantMessage are required" }, { status: 400 });
    }

    const db = getDb();
    await db.insert(chatMessages).values([
      { role: "user", content: userMessage, contextUsed: "general" },
      { role: "assistant", content: assistantMessage, contextUsed: "general" },
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/assistant/save]", err);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }
}
