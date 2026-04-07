import { NextRequest, NextResponse } from "next/server";

interface GenerateBody {
  title?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  speakers?: string;
  price?: string;
  notes?: string;
}

interface GenerateResult {
  description: string;
  emailSubject: string;
  socialHook: string;
  agenda: string[];
}

const DEMO: GenerateResult = {
  description: `Join Sam Fongho of Midas Property Auctions for an unmissable event designed specifically for UK property investors and landlords. Whether you are a seasoned portfolio builder or purchasing your first investment property at auction, this session will give you the tools, knowledge, and contacts to move forward with confidence.\n\nYou will leave with a clear understanding of how the auction process works, how to analyse legal packs quickly, and how to structure deals — including creative finance options that most investors don't know exist.\n\nSpaces are strictly limited. This event consistently sells out. If you are serious about growing your property portfolio in 2026, this is the room you need to be in.`,
  emailSubject: "You're invited — Midas Property Auctions Event",
  socialHook: "The event UK property investors have been waiting for.",
  agenda: [
    "Welcome & introductions from Sam Fongho",
    "How to find and analyse auction lots",
    "Legal pack walkthrough — what to look for",
    "Creative finance strategies for 2026",
    "Q&A and networking",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateBody;
    const { title, event_type, event_date, location, speakers, price, notes } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(DEMO);
    }

    const formattedDate = event_date
      ? new Date(event_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Date TBC";

    const userPrompt = `Write copy for this event:
Title: ${title ?? "Property Investment Event"}
Type: ${event_type ?? "webinar"}
Date: ${formattedDate}
Location: ${location ?? "Online"}
${speakers ? `Speakers: ${speakers}` : ""}
${price && price !== "0" ? `Price: £${price}/person` : "Free event"}
${notes ? `Notes: ${notes}` : ""}

Sam Fongho of Midas Property Auctions is hosting.
Audience: UK property investors and landlords.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 800,
        system: `You are an event copywriter for Midas Property Auctions. You write compelling event descriptions and promotional copy. UK English. Professional but warm. Sam Fongho hosts these events.

Return ONLY JSON with these exact keys:
{
  "description": string (150-250 words, compelling event description, what attendees will learn, who should attend, why this event matters),
  "emailSubject": string (max 60 chars, for the invite email),
  "socialHook": string (max 20 words, for social media — punchy opening line),
  "agenda": string[] (3-5 agenda items as strings)
}
No markdown, no code blocks, no explanation. Return raw JSON only.`,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(DEMO);
    }

    const data = await response.json() as {
      content?: Array<{ type: string; text: string }>;
    };
    const text = data.content?.[0]?.text ?? "";

    try {
      const parsed = JSON.parse(text) as GenerateResult;
      return NextResponse.json(parsed);
    } catch {
      console.error("[events/generate] JSON parse failed:", text);
      return NextResponse.json(DEMO);
    }
  } catch (err) {
    console.error("[POST /api/events/generate]", err);
    return NextResponse.json(DEMO);
  }
}
