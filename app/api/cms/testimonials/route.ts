import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { cmsTestimonials } from '@/lib/schema'
import type { NewCmsTestimonial } from '@/lib/schema'
import { asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const rows = await db.select().from(cmsTestimonials).orderBy(asc(cmsTestimonials.sortOrder))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[cms/testimonials GET]', err)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb()
    const body = await req.json() as Partial<NewCmsTestimonial>
    if (!body.name || !body.text) {
      return NextResponse.json({ error: 'name and text required' }, { status: 400 })
    }
    const [row] = await db.insert(cmsTestimonials).values({
      name: body.name,
      location: body.location ?? '',
      text: body.text,
      rating: body.rating ?? 5,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      source: body.source ?? 'direct',
    }).returning()
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error('[cms/testimonials POST]', err)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}
