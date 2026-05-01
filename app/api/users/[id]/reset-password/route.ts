import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const db = getDb()

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const firstName = user.name.split(' ')[0]
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  const tempPassword = `${firstName}Midas${rand}!`
  const hashed = await bcrypt.hash(tempPassword, 12)

  await db.update(users).set({ password: hashed }).where(eq(users.id, id))

  return NextResponse.json({ tempPassword, name: user.name })
}
