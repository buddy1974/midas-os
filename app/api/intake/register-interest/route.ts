/**
 * POST /api/intake/register-interest
 *
 * Called by the website's RegisterInterestForm on property detail pages.
 * Requires: x-api-key header matching WEBSITE_API_KEY env var.
 *
 * Actions:
 *  1. Upsert contact into CRM
 *  2. Log activity
 *  3. Send confirmation email to user
 *  4. Send alert email to team
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { contacts, activityLog } from '@/lib/schema'
import { requireIntakeKey } from '@/lib/intake-auth'
import {
  sendRegisterInterestConfirmation,
  sendRegisterInterestAlert,
} from '@/lib/email'

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
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const interest = typeof body.interest === 'string' ? body.interest.trim() : 'Buyer'
    const lotAddress = typeof body.lotAddress === 'string' ? body.lotAddress.trim() : ''
    const lotId = typeof body.lotId === 'string' ? body.lotId.trim() : null

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const db = getDb()

    const notes = [
      lotAddress ? `Interest in: ${lotAddress}` : null,
      lotId ? `Lot ID: ${lotId}` : null,
      `Interest type: ${interest}`,
    ]
      .filter(Boolean)
      .join(' | ')

    const [contact] = await db
      .insert(contacts)
      .values({
        name,
        email: email || null,
        phone: phone || null,
        contactType: interest.toLowerCase() === 'investor' ? 'investor' : 'buyer',
        score: 40,
        status: 'warm',
        notes,
      })
      .onConflictDoNothing()
      .returning()

    await db.insert(activityLog).values({
      eventType: 'lead_register_interest',
      description: `New register-interest lead: ${name}${lotAddress ? ` — ${lotAddress}` : ''}`,
      metadata: { name, email, phone, interest, lotAddress, lotId },
    })

    // Fire-and-forget emails — don't let email failure block the response
    if (email) {
      void sendRegisterInterestConfirmation({ name, email, lotAddress })
    }
    void sendRegisterInterestAlert({ name, email, phone, interest, lotAddress, lotId: lotId ?? undefined })

    return NextResponse.json({ success: true, contactId: contact?.id ?? null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/intake/register-interest]', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
