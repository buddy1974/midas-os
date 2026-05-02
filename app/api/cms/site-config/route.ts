import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { siteConfig } from '@/lib/schema'

/**
 * Internal OS route for the Website CMS tab to save site config.
 * Protected by NextAuth session — never called from outside the OS dashboard.
 * The public POST /api/public/config is protected by CMS_WRITE_TOKEN
 * and is reserved for the external website's on-demand revalidation flow.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    return NextResponse.json({ updated })
  } catch (err) {
    console.error('[cms/site-config POST]', err)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
