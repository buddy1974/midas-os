import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { teamMembers } from '@/lib/schema'
import type { NewTeamMember } from '@/lib/schema'
import { asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const rows = await db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[cms/team GET]', err)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb()
    const body = await req.json() as Partial<NewTeamMember>
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const [row] = await db.insert(teamMembers).values({
      name: body.name,
      role: body.role ?? '',
      initials: body.initials ?? body.name.split(' ').map((w: string) => w[0]).join('').slice(0, 4),
      bio: body.bio ?? '',
      phone: body.phone ?? '',
      email: body.email ?? '',
      linkedin: body.linkedin ?? '',
      photoUrl: body.photoUrl ?? '',
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
      showOnWebsite: body.showOnWebsite ?? true,
    }).returning()
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error('[cms/team POST]', err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
