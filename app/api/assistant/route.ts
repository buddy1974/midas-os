import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lots, contacts, campaigns, events, activityLog } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

// Rate limit: max 20 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

function fmt(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json() as { messages?: unknown[]; contextType?: string };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const last = messages[messages.length - 1] as { role?: string };
    if (last?.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
    }

    if (!hasOpenAI()) {
      return NextResponse.json({ error: "offline", demo: true }, { status: 503 });
    }

    // Fetch live context
    const db = getDb();
    const [recentLots, recentContacts, recentCampaigns, recentEvents, recentActivity] = await Promise.all([
      db.select({
        address: lots.address,
        guidePrice: lots.guidePrice,
        pipelineStage: lots.pipelineStage,
        propertyType: lots.propertyType,
      }).from(lots).orderBy(desc(lots.createdAt)).limit(5),
      db.select({
        name: contacts.name,
        email: contacts.email,
        status: contacts.status,
        score: contacts.score,
      }).from(contacts).orderBy(desc(contacts.createdAt)).limit(5),
      db.select({
        subject: campaigns.subject,
        status: campaigns.status,
        openRate: campaigns.openRate,
      }).from(campaigns).orderBy(desc(campaigns.createdAt)).limit(3),
      db.select({
        title: events.title,
        eventDate: events.eventDate,
      }).from(events).orderBy(desc(events.createdAt)).limit(3),
      db.select({
        eventType: activityLog.eventType,
        description: activityLog.description,
      }).from(activityLog).orderBy(desc(activityLog.createdAt)).limit(5),
    ]);

    const businessContext = `PIPELINE LOTS:
${recentLots.map((l) => `- ${l.address} | Guide: ${fmt(l.guidePrice)} | Stage: ${l.pipelineStage} | Type: ${l.propertyType ?? "Unknown"}`).join("\n")}

CRM CONTACTS:
${recentContacts.map((c) => `- ${c.name} (${c.email ?? "no email"}) | Status: ${c.status} | Score: ${c.score}`).join("\n")}

CAMPAIGNS:
${recentCampaigns.map((c) => `- "${c.subject}" | ${c.status} | Open rate: ${c.openRate}%`).join("\n")}

UPCOMING EVENTS:
${recentEvents.map((e) => `- ${e.title} | ${new Date(e.eventDate).toLocaleDateString("en-GB")}`).join("\n")}

RECENT ACTIVITY:
${recentActivity.map((a) => `- [${a.eventType}] ${a.description}`).join("\n")}`;

    const systemPrompt = `You are ARIA — the AI assistant embedded inside Midas OS, the private intelligence platform for Midas Property Auctions, run by Sam Fongho in London.

You are a senior property investment expert, business strategist, and trusted colleague. You know Sam's business inside out.

CAPABILITIES:
- Answer any UK property question (auctions, HMO, BTL, planning, SDLT, bridging, creative finance, short lease, JV, supported living)
- Draft professional emails Sam can copy + send
- Analyse deals given address + price
- Write social media posts for any lot
- Prepare Sam for meetings and auction days
- Summarise his pipeline, CRM, campaigns
- Write event descriptions and marketing copy
- Advise on portfolio strategy
- Give UK market intelligence

TONE: Expert colleague. Direct. UK English. Never generic. Never waffle. Give Sam exactly what he needs to act.

LIVE BUSINESS DATA:
${businessContext}

When drafting emails: format with
Subject: [subject line]

[email body]

Reference real lot/contact data when relevant. Never invent names or addresses not in the data.`;

    const historyMessages = messages.slice(-12).map((m) => {
      const msg = m as { role: string; content: string };
      return { role: msg.role as "user" | "assistant", content: msg.content };
    });

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("[POST /api/assistant]", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
