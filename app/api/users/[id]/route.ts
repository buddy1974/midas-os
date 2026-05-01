import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import type { Role } from '@/lib/permissions'

async function getAdminSession() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'admin') return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const selfId = (session.user as { id?: string }).id

  const body = await req.json() as { role?: Role; is_active?: boolean }

  // Cannot change own role or deactivate self
  if (id === selfId) {
    if ('role' in body || 'is_active' in body) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
    }
  }

  const update: Partial<{ role: string; isActive: boolean }> = {}
  if (body.role !== undefined) update.role = body.role
  if (body.is_active !== undefined) update.isActive = body.is_active

  const db = getDb()
  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })

  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ user: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const selfId = (session.user as { id?: string }).id

  if (id === selfId) {
    return NextResponse.json({ error: 'Cannot remove your own account' }, { status: 400 })
  }

  const db = getDb()
  await db.update(users).set({ isActive: false }).where(eq(users.id, id))
  return NextResponse.json({ ok: true })
}
