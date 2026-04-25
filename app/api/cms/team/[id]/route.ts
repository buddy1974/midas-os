import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { teamMembers } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const allowed = ['name','role','initials','bio','phone','email','linkedin','photoUrl','sortOrder','isActive','showOnWebsite']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    const [row] = await db.update(teamMembers).set(update).where(eq(teamMembers.id, id)).returning()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (err) {
    console.error('[cms/team/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.update(teamMembers).set({ isActive: false }).where(eq(teamMembers.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cms/team/:id DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
