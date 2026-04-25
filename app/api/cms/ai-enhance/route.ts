import { NextResponse } from 'next/server'
import { getOpenAI, hasOpenAI } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const DEMO_ENHANCEMENTS: Record<string, string> = {
  hero_subtitle:
    'Standing at the forefront of London property auctions since 2015, Midas connects committed buyers with committed sellers through professional, data-driven auction services across London, Essex and nationwide.',
  home_hero_subtitle:
    'Standing at the forefront of London property auctions since 2015, Midas connects committed buyers with committed sellers through professional, data-driven auction services.',
  about_company_story:
    'Founded in 2015 by Sam Fongho, Midas Property Group was built on a simple belief: that property auctions should be accessible, transparent and professional for both buyers and sellers. What started as a consultancy helping investors navigate London\'s auction market has grown into a full-service property auction house with a database of over 2,847 active investors.',
  about_sam_bio:
    'Sam Fongho has over 15 years of experience in UK property investment and auctions. A former Senior IT Consultant to Goldman Sachs, JP Morgan and CitiBank, Sam founded Midas Property Group in 2015 to bring professional, data-driven auction services to London and Essex investors.',
  lot_description:
    'A well-presented investment opportunity in a sought-after location. The property offers excellent potential for the discerning investor, with strong fundamentals and clear exit strategies. Legal pack available for immediate inspection. Viewings strictly by appointment.',
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { content?: string; fieldName?: string; context?: string }
    const { content, fieldName = 'content', context = 'Midas Property Auctions website' } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    if (!hasOpenAI()) {
      const demo = DEMO_ENHANCEMENTS[fieldName] ?? content.trim() + ' [AI-enhanced version would appear here — add OPENAI_API_KEY to enable]'
      return NextResponse.json({ enhanced: demo })
    }

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional property marketing copywriter for Midas Property Auctions, a London auction house. Write clear, professional UK English. Active voice. No jargon. Warm but professional tone. Return ONLY the enhanced content — no preamble, no explanations, no quotes around the output.',
        },
        {
          role: 'user',
          content: `Field: ${fieldName}\nContext: ${context}\n\nEnhance this for the Midas Property Auctions website:\n\n${content}\n\nMake it professional, compelling and on-brand. Keep it concise. UK English.`,
        },
      ],
    })

    const enhanced = completion.choices[0].message.content ?? content
    return NextResponse.json({ enhanced })
  } catch (err) {
    console.error('[cms/ai-enhance]', err)
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
