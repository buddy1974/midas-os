import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { blogPosts } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id))
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[cms/posts/:id GET]', err)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const allowed = ['title','slug','category','tags','content','excerpt','coverImage','gradient','isPublished','publishedAt','author','seoTitle','seoDescription']
    const update: Record<string, unknown> = { updatedAt: new Date() }

    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }
    if (body.isPublished === true && !body.publishedAt) {
      update.publishedAt = new Date()
    }

    const [row] = await db.update(blogPosts).set(update).where(eq(blogPosts.id, id)).returning()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[cms/posts/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(blogPosts).where(eq(blogPosts.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cms/posts/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
