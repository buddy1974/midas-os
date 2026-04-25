import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

interface LotInfo {
  address?: string;
  guidePrice?: number;
  propertyType?: string;
}

interface GenerateBody {
  templateType?: string;
  lots?: LotInfo[];
  eventDetails?: string;
  notes?: string;
}

interface AiSuggestion {
  subject: string;
  preview: string;
  intro: string;
}

const DEMO_SUGGESTIONS: Record<string, AiSuggestion> = {
  auction_alert: {
    subject: "🔨 New Auction Lot — Don't Miss Out",
    preview: "An exceptional property has just been listed. Register to bid today.",
    intro:
      "We have just listed a new auction lot that we believe represents an outstanding investment opportunity. With a competitive guide price and strong ARV potential, this property is attracting significant interest. Register your interest now to secure your place.",
  },
  lot_showcase: {
    subject: "🏠 Featured Lot: Prime Investment Opportunity",
    preview: "This week's standout property from the Midas pipeline.",
    intro:
      "Each month we spotlight the very best lots from our pipeline — properties that combine strong fundamentals with exceptional growth potential. This month's featured lot is no exception, offering investors a rare chance to acquire a high-yield asset at a compelling price.",
  },
  deal_spotlight: {
    subject: "💰 Exclusive Deal Alert — High Yield Opportunity",
    preview: "One of our strongest deals this quarter. Available now.",
    intro:
      "Our sourcing team has identified an exceptional deal that we wanted to share with our investor community first. This property offers a yield profile that significantly outperforms the local market average, with a clear value-add strategy already in place.",
  },
  event_invite: {
    subject: "📅 You're Invited — Midas Investor Evening",
    preview: "Join Sam and the team for an exclusive investor networking event.",
    intro:
      "We are delighted to invite you to an exclusive Midas investor evening. Join Sam Fongho and our team for an evening of market insights, live auction previews, and networking with fellow property investors across London and Essex.",
  },
  market_update: {
    subject: "📊 Q1 Market Insights — London Auction Trends",
    preview: "Key data and analysis from the Midas research desk.",
    intro:
      "The property auction market continues to show resilience, with London and Essex leading growth across several key metrics. Our research team has compiled the latest data on guide prices, sold percentages, and emerging hotspots — all relevant to your investment strategy.",
  },
  creative_finance: {
    subject: "🤝 Creative Finance: No Cash? No Problem.",
    preview: "Alternative funding strategies for your next acquisition.",
    intro:
      "Not every deal requires a full cash deposit on day one. Our team has been working with investors to structure creative finance solutions — bridging, JVs, and instalment arrangements — that make high-value acquisitions accessible without tying up capital.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateBody;
    const { templateType = "auction_alert", lots = [], eventDetails, notes } = body;

    if (!hasOpenAI()) {
      const demo = DEMO_SUGGESTIONS[templateType] ?? DEMO_SUGGESTIONS.auction_alert;
      return NextResponse.json(demo);
    }

    const lotsText =
      lots.length > 0
        ? lots
            .map(
              (l) =>
                `- ${l.address ?? "Unknown address"} | Guide: £${l.guidePrice ? (l.guidePrice / 100).toLocaleString("en-GB") : "TBC"} | Type: ${l.propertyType ?? "N/A"}`
            )
            .join("\n")
        : "No specific lots selected.";

    const userPrompt = `Template type: ${templateType}
Lots featured:
${lotsText}
${eventDetails ? `Event details: ${eventDetails}` : ""}
${notes ? `Additional notes: ${notes}` : ""}

Generate email copy for this Midas Property Auctions newsletter.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert email copywriter for Midas Property Auctions, a UK property auction company. You write compelling, professional email content for property investors in London and Essex.

Return ONLY a JSON object with exactly these keys:
{
  "subject": string (max 60 chars, compelling, specific),
  "preview": string (max 90 chars, expands on subject),
  "intro": string (2-3 sentences, warm professional tone, UK English, references the specific content)
}
No markdown, no code blocks, no explanation.`,
        },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0].message.content ?? "";

    const parsed = JSON.parse(text) as AiSuggestion;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[POST /api/newsletter/generate]", err);
    const templateType = "auction_alert";
    return NextResponse.json(DEMO_SUGGESTIONS[templateType]);
  }
}
