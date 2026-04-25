import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { cmsTestimonials } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const allowed = ['name','location','text','rating','isActive','sortOrder','source']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    const [row] = await db.update(cmsTestimonials).set(update).where(eq(cmsTestimonials.id, id)).returning()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[cms/testimonials/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.update(cmsTestimonials).set({ isActive: false }).where(eq(cmsTestimonials.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cms/testimonials/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
