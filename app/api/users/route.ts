import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import type { Role } from '@/lib/permissions'

function requireAdmin(role: string | undefined): boolean {
  return role === 'admin'
}

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!requireAdmin(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = getDb()
  const all = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastLogin: users.lastLogin,
      createdBy: users.createdBy,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt)

  return NextResponse.json({ users: all })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  const creatorEmail = session?.user?.email ?? ''

  if (!requireAdmin(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, role: newRole } = await req.json() as {
    name: string
    email: string
    role: Role
  }

  if (!name || !email || !newRole) {
    return NextResponse.json({ error: 'name, email and role are required' }, { status: 400 })
  }

  const db = getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const firstName = name.split(' ')[0]
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  const tempPassword = `${firstName}Midas${rand}!`
  const hashed = await bcrypt.hash(tempPassword, 12)

  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashed,
      role: newRole,
      isActive: true,
      createdBy: creatorEmail,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })

  return NextResponse.json({ user: created, tempPassword })
}
