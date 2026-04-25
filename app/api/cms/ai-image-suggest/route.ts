import { NextResponse } from 'next/server'
import { getOpenAI, hasOpenAI } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const CATEGORY_DEFAULTS: Record<string, string> = {
  Guide: 'london property auction',
  Investment: 'property investment uk',
  Finance: 'bridging finance building',
  'Market Report': 'london cityscape skyline',
  News: 'london architecture',
  Events: 'property networking event',
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { title?: string; category?: string }
    const { title = '', category = 'Guide' } = body

    const defaultQuery = CATEGORY_DEFAULTS[category] ?? 'london property'

    if (!hasOpenAI()) {
      return NextResponse.json({
        query: defaultQuery,
        unsplash_url: `https://unsplash.com/search/photos/${encodeURIComponent(defaultQuery)}`,
        suggestion: `Search Unsplash for: "${defaultQuery}"`,
      })
    }

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 30,
      temperature: 0.5,
      messages: [
        { role: 'system', content: 'Return ONLY a short Unsplash search query (3-5 words) for property auction blog content. No quotes, no explanation.' },
        { role: 'user', content: `Blog: "${title}" Category: ${category}` },
      ],
    })

    const query = (completion.choices[0].message.content ?? defaultQuery).trim().replace(/['"]/g, '')
    return NextResponse.json({
      query,
      unsplash_url: `https://unsplash.com/search/photos/${encodeURIComponent(query)}`,
      suggestion: `Try searching Unsplash for: "${query}"`,
    })
  } catch (err) {
    console.error('[cms/ai-image-suggest]', err)
    return NextResponse.json({ error: 'Suggestion failed' }, { status: 500 })
  }
}
