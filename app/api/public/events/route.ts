import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { events } from '@/lib/schema'
import { and, eq, gte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Cache-Control': 'public, s-maxage=60',
}

export async function GET() {
  try {
    const db = getDb()
    const publicEvents = await db
      .select({
        id: events.id,
        title: events.title,
        eventType: events.eventType,
        eventDate: events.eventDate,
        endTime: events.endTime,
        location: events.location,
        description: events.description,
        maxCapacity: events.maxCapacity,
        pricePence: events.pricePence,
        coverImage: events.coverImage,
      })
      .from(events)
      .where(
        and(
          eq(events.showOnWebsite, true),
          gte(events.eventDate, sql`now()`)
        )
      )
      .orderBy(events.eventDate)

    return NextResponse.json({ events: publicEvents }, { headers: CORS })
  } catch (error) {
    console.error('[public/events]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
