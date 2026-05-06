import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { contentHistory, siteConfig } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { historyId } = await req.json() as { historyId: string }

    if (!historyId) return NextResponse.json({ error: 'historyId required' }, { status: 400 })

    const [entry] = await db
      .select()
      .from(contentHistory)
      .where(eq(contentHistory.id, historyId))
      .limit(1)

    if (!entry) return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
    if (!entry.previousValue) return NextResponse.json({ error: 'No previous value to restore' }, { status: 400 })

    if (entry.contentType === 'page_section') {
      const current = await db
        .select({ value: siteConfig.value })
        .from(siteConfig)
        .where(eq(siteConfig.key, entry.contentId))
        .limit(1)

      await db
        .insert(siteConfig)
        .values({ key: entry.contentId, value: entry.previousValue })
        .onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: entry.previousValue, updatedAt: new Date() },
        })

      await db.insert(contentHistory).values({
        contentType: entry.contentType,
        contentId: entry.contentId,
        previousValue: current[0]?.value ?? null,
        newValue: entry.previousValue,
        changedBy: session.user.email ?? 'unknown',
        label: `Restored to earlier version`,
      })
    }

    return NextResponse.json({ success: true, restoredValue: entry.previousValue })
  } catch (err) {
    console.error('[cms/restore POST]', err)
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 })
  }
}
