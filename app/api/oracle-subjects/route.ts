import { NextRequest, NextResponse } from "next/server";

type TemplateType =
  | "auction_alert"
  | "deal_spotlight"
  | "event_invite"
  | "legal_pack"
  | "registration_close"
  | "monthly_digest";

const DEMO_SUGGESTIONS: Record<TemplateType, string[]> = {
  auction_alert: [
    "New Lot: £160k+ Dagenham Flat with Creative Finance (Rare)",
    "🔨 Just Listed: Vacant 2-Bed Below Market Value — Act Fast",
    "Auction Alert: Planning Permission Granted — Loft Conversion",
  ],
  deal_spotlight: [
    "This HMO Produces £123,600/Year — Viewing This Week",
    "Off-Market Deal: 9-Room Licensed HMO, Harrow HA3",
    "Investor Alert: 15%+ Gross Yield — Full Legal Pack Ready",
  ],
  event_invite: [
    "Join Us at MIPIM 2026 — Midas Pre-Event Networking",
    "Free Webinar: How to Buy Below Market Value at Auction",
    "You're Invited: Property Investment Masterclass — Apr 2026",
  ],
  legal_pack: [
    "Legal Pack Now Live: 22 Fletcher Road — Auction 14 Apr",
    "📋 Documents Ready: Review Before Bidding Closes Thursday",
    "Legal Pack Alert: Vacant Possession — No Chain, No Delays",
  ],
  registration_close: [
    "⏰ 48 Hours Left: Register to Bid on 12 Prime Lots",
    "Final Reminder: Bidder Registration Closes Tomorrow 5PM",
    "Last Chance — 3 Lots with No Reserve Still Available",
  ],
  monthly_digest: [
    "April Market Digest: Auction Volume Up 18% — Key Insights",
    "Your Monthly Midas Report: Rates, Results & Radar",
    "Market Update: 3 Deals That Closed Above Guide This Month",
  ],
};

function getFallback(templateType: string): string[] {
  return (
    DEMO_SUGGESTIONS[(templateType as TemplateType)] ?? [
      `${templateType.replace(/_/g, " ")} campaign — grab attention with a strong hook`,
      "Exclusive opportunity for Midas investors — limited availability",
      "Time-sensitive alert: action required before Friday deadline",
    ]
  );
}

interface AnthropicMessage {
  content: { type: string; text: string }[];
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>;
  const templateType =
    typeof body.template_type === "string" ? body.template_type : "";
  const segment =
    typeof body.segment === "string" ? body.segment : "property investors";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ suggestions: getFallback(templateType) });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 300,
        system:
          "You generate email subject lines for Midas Property Auctions, a UK property auction company. Return ONLY a JSON array of exactly 3 subject line strings. No markdown, no explanation, no code blocks. Each subject line should be compelling, specific, and under 60 characters. Use UK English spelling.",
        messages: [
          {
            role: "user",
            content: `Generate 3 email subject lines for a ${templateType.replace(/_/g, " ")} campaign targeting ${segment} in the UK property auction market.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: getFallback(templateType) });
    }

    const data = await res.json() as AnthropicMessage;
    const rawText = data.content?.[0]?.text ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ suggestions: getFallback(templateType) });
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ suggestions: getFallback(templateType) });
    }

    const suggestions = parsed.filter((s): s is string => typeof s === "string").slice(0, 3);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: getFallback(templateType) });
  }
}
