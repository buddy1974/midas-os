import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter — max 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  return true;
}

interface OracleRequestBody {
  address: string;
  propertyType: string;
  guidePrice: number;
  bedrooms: string;
  condition: string;
  notes: string;
}

interface AnthropicMessage {
  content: { type: string; text: string }[];
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Oracle offline", demo: true },
      { status: 503 }
    );
  }

  let body: OracleRequestBody;
  try {
    body = await req.json() as OracleRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { address, propertyType, guidePrice, bedrooms, condition, notes } = body;

  if (!address || address.trim().length < 10) {
    return NextResponse.json(
      { error: "address must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (!guidePrice || typeof guidePrice !== "number" || guidePrice <= 0) {
    return NextResponse.json(
      { error: "guidePrice must be a positive number" },
      { status: 400 }
    );
  }

  const prompt = `Analyse this UK property investment opportunity:
Address: ${address}
Type: ${propertyType || "Not specified"}
Bedrooms: ${bedrooms || "Not specified"}
Guide Price: £${guidePrice.toLocaleString("en-GB")}
Condition: ${condition || "Not specified"}
Notes: ${notes || "None"}

Provide deal score, yield estimate, ARV, rental estimate, risks, opportunities and a clear investment verdict.`;

  const systemPrompt = `You are an expert UK property investment analyst with 20 years of experience in the London and Greater London auction market. You work for Midas Property Auctions.

Respond ONLY with a JSON object — no markdown, no code blocks, no preamble. The JSON must have exactly these keys:

{
  "dealScore": number (0-100),
  "scoreLabel": string (one of: "Exceptional" | "Strong" | "Solid" | "Marginal" | "Weak"),
  "roiEstimate": string (e.g. "18–24%"),
  "grossYieldEstimate": string (e.g. "6.2%"),
  "arv": number (estimated after-refurb value in pounds),
  "rentalEstimate": string (e.g. "£950–£1,100/month"),
  "riskLevel": string ("Low" | "Medium" | "High"),
  "keyRisks": string[] (2–3 short bullet strings),
  "opportunities": string[] (2–3 short bullet strings),
  "verdict": string (3–4 sentences, plain English, actionable investment advice for this specific property),
  "comparables": string (brief note on comparable sales in the area)
}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[Oracle] Anthropic API error:", errText);
      return NextResponse.json(
        { error: "Oracle analysis failed" },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicRes.json() as AnthropicMessage;
    const rawText = anthropicData.content?.[0]?.text ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("[Oracle] JSON parse error:", rawText);
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[Oracle] Fetch error:", err);
    return NextResponse.json({ error: "Oracle analysis failed" }, { status: 500 });
  }
}
