import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { lots, newsletterSubscribers } from '@/lib/schema'
import { eq, inArray, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Cache-Control': 'public, s-maxage=60',
}

export async function GET() {
  try {
    const db = getDb()

    const [soldResult] = await db
      .select({ count: count() })
      .from(lots)
      .where(eq(lots.pipelineStage, 'completed'))

    const [subscribersResult] = await db
      .select({ count: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'confirmed'))

    const [activeResult] = await db
      .select({ count: count() })
      .from(lots)
      .where(inArray(lots.pipelineStage, ['sourcing', 'legal_pack', 'live']))

    return NextResponse.json({
      propertiesSold: soldResult?.count ?? 0,
      activeInvestors: subscribersResult?.count ?? 0,
      activeLots: activeResult?.count ?? 0,
    }, { headers: CORS })
  } catch (error) {
    console.error('[public/stats]', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
