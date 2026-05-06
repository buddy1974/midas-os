import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { siteConfig, contentHistory } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const body = await req.json() as { key: string; value: string; label?: string }
    const { key, value, label } = body

    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

    const existing = await db
      .select({ value: siteConfig.value })
      .from(siteConfig)
      .where(eq(siteConfig.key, key))
      .limit(1)

    const previousValue = existing[0]?.value ?? null

    await db
      .insert(siteConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } })

    await db.insert(contentHistory).values({
      contentType: 'page_section',
      contentId: key,
      previousValue,
      newValue: value,
      changedBy: session.user.email ?? session.user.name ?? 'unknown',
      label: label ?? `Updated ${key}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cms/save-section POST]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
