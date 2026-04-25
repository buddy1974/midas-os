import { NextResponse } from 'next/server'
import { getOpenAI, hasOpenAI } from '@/lib/openai'

export const dynamic = 'force-dynamic'

interface SeoResult {
  seo_title: string
  seo_description: string
  keywords: string[]
  og_title: string
  reading_time: number
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { title?: string; content?: string; category?: string }
    const { title = '', content = '', category = 'Guide' } = body

    if (!hasOpenAI()) {
      const demo: SeoResult = {
        seo_title: title.slice(0, 60) || 'Property Investment Guide | Midas',
        seo_description: content.slice(0, 155) || 'Expert property auction advice from Midas Property Auctions — London and Essex specialists.',
        keywords: ['property auction', 'london property', 'investment', 'hmo', 'bridging finance', 'buy to let', 'auction guide', 'midas property'],
        og_title: title.slice(0, 70) || 'Property Guide | Midas Property Auctions',
        reading_time: Math.max(1, Math.ceil(content.split(' ').length / 200)),
      }
      return NextResponse.json(demo)
    }

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are an SEO specialist for a UK property auction website. Return ONLY valid JSON, no markdown fences:\n{"seo_title":"string max 60 chars","seo_description":"string max 155 chars","keywords":["8-12 keywords"],"og_title":"string max 70 chars","reading_time":number}',
        },
        {
          role: 'user',
          content: `Blog post title: ${title}\nCategory: ${category}\nContent excerpt: ${content.slice(0, 500)}\n\nGenerate SEO metadata targeting UK property investors.`,
        },
      ],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as SeoResult
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[cms/ai-seo]', err)
    return NextResponse.json({ error: 'SEO generation failed' }, { status: 500 })
  }
}
