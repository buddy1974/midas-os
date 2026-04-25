import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { lots, socialPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

type Platform = "linkedin" | "instagram" | "facebook" | "twitter";
type Tone = "professional" | "urgent" | "educational" | "community";

interface GenerateBody {
  lotId?: string;
  platform: Platform;
  tone: Tone;
  customNotes?: string;
}

interface GenerateResult {
  post: string;
  hashtags: string;
  hook: string;
  cta: string;
}

function formatPrice(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toLocaleString("en-GB")}`;
}

const DEMO: Record<Platform, GenerateResult> = {
  linkedin: {
    post: `🏛 New Auction Lot — 202A Bennetts Castle Lane, Dagenham RM8 3XP

Vacant 2-bed first-floor flat with planning permission to add a third bedroom in the loft.

Guide price: £160,000+

Vendor is open to creative finance — a rare opportunity for investors who want flexibility on deal structure.

Legal pack available. Register to bid before the deadline.

Interested? WhatsApp Sam: 07454 753318
Sam@MidasPropertyAuctions.co.uk`,
    hook: "New Auction Lot — rare creative finance deal",
    hashtags:
      "#PropertyAuction #UKProperty #LondonProperty #PropertyInvestment #AuctionProperty #BTL #HMO #MidasPropertyAuctions",
    cta: "WhatsApp Sam on 07454 753318 to register interest",
  },
  instagram: {
    post: `🔨 NEW LOT ALERT 🔨

202A Bennetts Castle Lane, Dagenham RM8 3XP

2-bed flat | Guide £160k+ | Creative finance available 🏠

This one won't last — register your interest NOW 👇

📲 Link in bio | DM us for the legal pack`,
    hook: "New lot alert — creative finance available",
    hashtags:
      "#PropertyAuction #UKProperty #LondonProperty #PropertyInvestment #AuctionProperty #BTL #HMO #MidasPropertyAuctions #PropertyInvestor #UKAuction #DagenhamProperty #EstateAgent",
    cta: "DM us or tap the link in bio to register",
  },
  facebook: {
    post: `🏠 New Auction Lot — Dagenham, East London

We've just listed 202A Bennetts Castle Lane, RM8 3XP.

Vacant 2-bed flat with planning permission for a 3rd bedroom. Guide price just £160,000+ and the vendor is open to creative finance deals.

Legal pack is ready. Auction date coming soon.

📞 Call or WhatsApp Sam directly: 07454 753318
✉️ Sam@MidasPropertyAuctions.co.uk

Who's interested? Drop a comment or message us! 👇`,
    hook: "New auction lot in Dagenham — motivated vendor",
    hashtags:
      "#PropertyAuction #UKProperty #LondonProperty #PropertyInvestment #AuctionProperty #BTL #MidasPropertyAuctions #Dagenham",
    cta: "Call or WhatsApp Sam on 07454 753318",
  },
  twitter: {
    post: `🔨 New lot: 202A Bennetts Castle Lane, Dagenham. 2-bed flat, guide £160k+, creative finance available. Legal pack ready. DM to bid. #PropertyAuction #UKProperty #BTL`,
    hook: "New lot — creative finance, £160k guide price",
    hashtags: "#PropertyAuction #UKProperty #BTL",
    cta: "DM to register interest",
  },
};

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  linkedin: `LinkedIn: Professional tone. 150-300 words. Use line breaks for readability. Start with a strong hook. End with a question or CTA. No excessive emojis — max 3 per post. Include Sam's WhatsApp and email.`,
  instagram: `Instagram: Visual, energetic. 80-150 words. Use emojis naturally. Line breaks every 2-3 lines. Strong hashtag strategy. CTA to DM or link in bio. No contact details in body.`,
  facebook: `Facebook: Conversational. 100-200 words. Warm community tone. Direct CTA with Sam's phone number and WhatsApp. Include Sam's email.`,
  twitter: `Twitter/X: Punchy. Max 260 characters for the post body (hashtags will be appended). One strong statement. 2-3 hashtags max. No contact details — DM CTA only.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateBody;
    const { lotId, platform, tone, customNotes } = body;

    if (!platform || !tone) {
      return NextResponse.json({ error: "platform and tone are required" }, { status: 400 });
    }

    const db = getDb();
    let lotContext = "";

    if (lotId) {
      const [lot] = await db.select().from(lots).where(eq(lots.id, lotId)).limit(1);
      if (!lot) {
        return NextResponse.json({ error: "Lot not found" }, { status: 404 });
      }
      lotContext = `Address: ${lot.address}
Type: ${lot.propertyType ?? "N/A"}
Bedrooms: ${lot.bedrooms ?? "N/A"}
Guide Price: ${formatPrice(lot.guidePrice)}
Pipeline Stage: ${lot.pipelineStage}
${lot.arv ? `After Refurb Value: ${formatPrice(lot.arv)}` : ""}
${lot.notes ? `Notes: ${lot.notes}` : ""}`;
    } else {
      lotContext = "General post — no specific lot.";
    }

    if (!hasOpenAI()) {
      const demo = DEMO[platform];
      const [saved] = await db
        .insert(socialPosts)
        .values({
          lotId: lotId ?? null,
          platform,
          tone,
          content: demo.post,
          hashtags: demo.hashtags,
          status: "draft",
        })
        .returning();
      return NextResponse.json({ ...demo, id: saved.id });
    }

    const userPrompt = `Generate a ${tone} ${platform} post for this property:

${lotContext}
${customNotes ? `Additional context: ${customNotes}` : ""}

Make it compelling for UK property investors.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are a social media expert for Midas Property Auctions, a UK property auction company run by Sam Fongho, based in London. You write compelling, platform-native social media content.

Sam's tone: confident, knowledgeable, community-focused. He empowers investors. He speaks directly. UK English only. No Americanisms.

${PLATFORM_GUIDELINES[platform]}

Always include Sam's contact when appropriate:
  WhatsApp: 07454 753318
  Email: Sam@MidasPropertyAuctions.co.uk
  (include in Facebook and LinkedIn, not Instagram or Twitter)

Return ONLY a JSON object with exactly these keys:
{
  "post": string (the full post text, ready to copy),
  "hashtags": string (8-12 relevant hashtags, space-separated, including #),
  "hook": string (first line only — the attention grabber, max 12 words),
  "cta": string (the call to action line at the end)
}
No markdown, no code blocks, no explanation. Return raw JSON only.`,
        },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0].message.content ?? "";

    let parsed: GenerateResult;
    try {
      parsed = JSON.parse(text) as GenerateResult;
    } catch {
      console.error("[social/generate] JSON parse failed:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const [saved] = await db
      .insert(socialPosts)
      .values({
        lotId: lotId ?? null,
        platform,
        tone,
        content: parsed.post,
        hashtags: parsed.hashtags,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ ...parsed, id: saved.id });
  } catch (err) {
    console.error("[POST /api/social/generate]", err);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
