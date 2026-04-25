import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

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

    if (!hasOpenAI()) {
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

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an event copywriter for Midas Property Auctions. You write compelling event descriptions and promotional copy. UK English. Professional but warm. Sam Fongho hosts these events.

Return ONLY JSON with these exact keys:
{
  "description": string (150-250 words, compelling event description, what attendees will learn, who should attend, why this event matters),
  "emailSubject": string (max 60 chars, for the invite email),
  "socialHook": string (max 20 words, for social media — punchy opening line),
  "agenda": string[] (3-5 agenda items as strings)
}
No markdown, no code blocks, no explanation. Return raw JSON only.`,
        },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0].message.content ?? "";

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
