import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { siteConfig, contentHistory } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const MENU_KEY = 'nav_menu_config'
const FOOTER_KEY = 'nav_footer_config'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, MENU_KEY))
      .limit(1)

    const footerRows = await db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, FOOTER_KEY))
      .limit(1)

    return NextResponse.json({
      menu: rows[0]?.value ? JSON.parse(rows[0].value) : [],
      footer: footerRows[0]?.value ? JSON.parse(footerRows[0].value) : [],
    })
  } catch (err) {
    console.error('[cms/menu GET]', err)
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const body = await req.json() as { menu?: unknown[]; footer?: unknown[] }

    if (body.menu !== undefined) {
      const val = JSON.stringify(body.menu)
      await db
        .insert(siteConfig)
        .values({ key: MENU_KEY, value: val })
        .onConflictDoUpdate({ target: siteConfig.key, set: { value: val, updatedAt: new Date() } })

      await db.insert(contentHistory).values({
        contentType: 'page_section',
        contentId: MENU_KEY,
        newValue: val,
        changedBy: session.user.email ?? 'unknown',
        label: 'Updated navigation menu',
      })
    }

    if (body.footer !== undefined) {
      const val = JSON.stringify(body.footer)
      await db
        .insert(siteConfig)
        .values({ key: FOOTER_KEY, value: val })
        .onConflictDoUpdate({ target: siteConfig.key, set: { value: val, updatedAt: new Date() } })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cms/menu POST]', err)
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 })
  }
}
