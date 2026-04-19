import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { lots } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Cache-Control': 'public, s-maxage=60',
}

export async function GET() {
  try {
    const db = getDb()
    const publicLots = await db
      .select({
        id: lots.id,
        address: lots.address,
        guidePrice: lots.guidePrice,
        soldPrice: lots.soldPrice,
        arv: lots.arv,
        bedrooms: lots.bedrooms,
        propertyType: lots.propertyType,
        pipelineStage: lots.pipelineStage,
        coverImage: lots.coverImage,
        images: lots.images,
        isOffMarket: lots.isOffMarket,
        notes: lots.notes,
        createdAt: lots.createdAt,
      })
      .from(lots)
      .where(eq(lots.showOnWebsite, true))
      .orderBy(lots.createdAt)

    return NextResponse.json({ lots: publicLots }, { headers: CORS })
  } catch (error) {
    console.error('[public/lots]', error)
    return NextResponse.json({ error: 'Failed to fetch lots' }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
