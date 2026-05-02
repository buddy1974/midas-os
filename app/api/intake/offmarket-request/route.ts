/**
 * POST /api/intake/offmarket-request
 *
 * Called when a visitor requests off-market access on the website.
 * Requires: x-api-key header matching WEBSITE_API_KEY env var.
 *
 * Actions:
 *  1. Upsert contact into CRM (type: investor, status: warm)
 *  2. Log activity
 *  3. Send alert to team (they qualify and issue the access code)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { contacts, activityLog } from '@/lib/schema'
import { requireIntakeKey } from '@/lib/intake-auth'
import { sendOffmarketRequestAlert } from '@/lib/email'

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export async function POST(req: NextRequest) {
  const authError = requireIntakeKey(req)
  if (authError) return authError

  try {
    const body = await req.json() as Record<string, unknown>

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const db = getDb()

    const [contact] = await db
      .insert(contacts)
      .values({
        name,
        email: email || null,
        contactType: 'investor',
        score: 50,
        status: 'warm',
        notes: 'Requested off-market access from website',
      })
      .onConflictDoNothing()
      .returning()

    await db.insert(activityLog).values({
      eventType: 'lead_offmarket_request',
      description: `Off-market access request: ${name}${email ? ` (${email})` : ''}`,
      metadata: { name, email },
    })

    void sendOffmarketRequestAlert({ name, email })

    return NextResponse.json({ success: true, contactId: contact?.id ?? null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/intake/offmarket-request]', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
