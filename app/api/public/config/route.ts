import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { siteConfig, teamMembers, cmsTestimonials, blogPosts } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cms-token',
  'Cache-Control': 'public, s-maxage=30',
}

function requireCmsToken(req: NextRequest): NextResponse | null {
  const secret = process.env.CMS_WRITE_TOKEN
  if (!secret) {
    // Block writes in production if token is not configured
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CMS writes are not configured' }, { status: 503 })
    }
    return null
  }
  const provided = req.headers.get('x-cms-token')
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  try {
    const db = getDb()

    const [configRows, teamRows, testimonialRows, postRows] = await Promise.all([
      db.select().from(siteConfig).orderBy(asc(siteConfig.sortOrder)),
      db.select().from(teamMembers).where(eq(teamMembers.showOnWebsite, true)).orderBy(asc(teamMembers.sortOrder)),
      db.select().from(cmsTestimonials).where(eq(cmsTestimonials.isActive, true)).orderBy(asc(cmsTestimonials.sortOrder)),
      db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(asc(blogPosts.publishedAt)),
    ])

    const config: Record<string, string> = {}
    for (const row of configRows) {
      config[row.key] = row.value
    }

    return NextResponse.json(
      { config, team: teamRows, testimonials: testimonialRows, posts: postRows },
      { headers: CORS }
    )
  } catch (err) {
    console.error('[public/config GET]', err)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500, headers: CORS })
  }
}

export async function POST(req: NextRequest) {
  const authError = requireCmsToken(req)
  if (authError) return authError

  try {
    const db = getDb()
    const body = await req.json() as Record<string, string>

    let updated = 0
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(siteConfig)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } })
      updated++
    }

    return NextResponse.json({ updated }, { headers: CORS })
  } catch (err) {
    console.error('[public/config POST]', err)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500, headers: CORS })
  }
}
