import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { blogPosts } from '@/lib/schema'
import type { NewBlogPost } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export async function GET() {
  try {
    const db = getDb()
    const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[cms/posts GET]', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb()
    const body = await req.json() as Partial<NewBlogPost>
    if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const now = new Date()
    const [row] = await db.insert(blogPosts).values({
      title: body.title,
      slug: body.slug ?? slugify(body.title),
      category: body.category ?? 'Guide',
      tags: body.tags ?? '',
      content: body.content ?? '',
      excerpt: body.excerpt ?? '',
      coverImage: body.coverImage ?? '',
      gradient: body.gradient ?? 'from-blue-900 to-[#080809]',
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? now : undefined,
      author: body.author ?? 'Midas Property Auctions',
      seoTitle: body.seoTitle ?? body.title,
      seoDescription: body.seoDescription ?? body.excerpt ?? '',
      updatedAt: now,
    }).returning()
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error('[cms/posts POST]', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
