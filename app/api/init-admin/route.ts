import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Bootstrap Sam's admin account — safe to run in production.
// Protected by INIT_SECRET env var when set.
export async function POST(req: Request) {
  const secret = process.env.INIT_SECRET
  if (secret) {
    const { secret: provided } = await req.json().catch(() => ({})) as { secret?: string }
    if (provided !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const db = getDb()
  const hashedPassword = await bcrypt.hash('MidasAdmin2026!', 12)

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'sam@midaspropertyauctions.co.uk'))
    .limit(1)

  if (existing) {
    await db
      .update(users)
      .set({ role: 'admin', password: hashedPassword, isActive: true })
      .where(eq(users.email, 'sam@midaspropertyauctions.co.uk'))
    return NextResponse.json({ ok: true, action: 'updated' })
  }

  await db.insert(users).values({
    name: 'Sam Fongho',
    email: 'sam@midaspropertyauctions.co.uk',
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  })

  return NextResponse.json({ ok: true, action: 'created' })
}
