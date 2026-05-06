import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import OpenAI from 'openai'

const DESTINATION_PROMPTS: Record<string, string> = {
  homepage_hero: 'Write a compelling homepage hero section. Return JSON: { h1Line1, h1Line2, subtitle, cta1Text }',
  property_listing: 'Write a professional UK property auction listing. Return JSON: { title, description, keyFeatures (array of 5 strings) }',
  blog_post: 'Write a well-structured blog post for a UK property investment audience. Return JSON: { title, excerpt, content (HTML), tags (array) }',
  event_description: 'Write a compelling event description for a UK property networking/auction event. Return JSON: { title, shortDescription, fullDescription (HTML) }',
  team_bio: 'Write a professional team member biography for a UK property company. Return plain text only.',
  testimonial: 'Rewrite this as a polished client testimonial. Return plain text only.',
  sell_page: 'Write engaging content for the "Sell your property" page of a UK property auction company. Return HTML.',
  about_page: 'Write engaging "About Us" content for a UK property auction company. Return HTML.',
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rawInput, destination, existingId } = await req.json() as {
      rawInput: string
      destination: string
      existingId?: string
    }

    if (!rawInput || !destination) {
      return NextResponse.json({ error: 'rawInput and destination required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        result: `[AI unavailable — OPENAI_API_KEY not set]\n\nYour input:\n${rawInput}`,
        destination,
        existingId,
      })
    }

    const client = new OpenAI({ apiKey })
    const destinationPrompt = DESTINATION_PROMPTS[destination] ?? 'Format this content professionally.'

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional copywriter for Midas Property Auctions, a London-based property auction and brokerage firm.
Write in a professional, trustworthy tone that appeals to UK property investors.
${destinationPrompt}`,
        },
        {
          role: 'user',
          content: rawInput,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const result = completion.choices[0]?.message.content ?? ''

    return NextResponse.json({ result, destination, existingId })
  } catch (err) {
    console.error('[cms/ai-generate POST]', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
