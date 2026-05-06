import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { contentHistory } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { searchParams } = new URL(req.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(contentHistory)
      .where(
        and(
          eq(contentHistory.contentType, contentType),
          eq(contentHistory.contentId, contentId),
        ),
      )
      .orderBy(desc(contentHistory.changedAt))
      .limit(10)

    return NextResponse.json(rows)
  } catch (err) {
    console.error('[cms/history GET]', err)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
