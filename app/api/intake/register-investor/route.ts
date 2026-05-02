/**
 * POST /api/intake/register-investor
 *
 * Full investor registration from the website's multi-step /register page.
 * Also handles the homepage NewsletterForm (source: newsletter_homepage)
 * and the WhatsApp signup form (source: whatsapp_signup).
 *
 * Requires: x-api-key header matching WEBSITE_API_KEY env var.
 *
 * Actions:
 *  1. Upsert enriched contact into CRM
 *  2. Upsert into newsletter_subscribers
 *  3. Log activity
 *  4. Send welcome email to investor
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { contacts, newsletterSubscribers, activityLog } from '@/lib/schema'
import { requireIntakeKey } from '@/lib/intake-auth'
import { sendInvestorWelcome } from '@/lib/email'

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export async function POST(req: NextRequest) {
  const authError = requireIntakeKey(req)
  if (authError) return authError

  try {
    const body = await req.json() as Record<string, unknown>

    // Support both the full register form AND the compact newsletter/whatsapp forms
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const fullName = typeof body.name === 'string' ? body.name.trim() : `${firstName} ${lastName}`.trim()

    const name = fullName || firstName || 'Unknown'
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone =
      typeof body.phone === 'string'
        ? body.phone.trim()
        : typeof body.whatsapp === 'string'
        ? body.whatsapp.trim()
        : ''

    const source = typeof body.source === 'string' ? body.source : 'website_register'
    const userType = typeof body.userType === 'string' ? body.userType : null
    const budget = typeof body.budget === 'string' ? body.budget : null
    const lookingFor = Array.isArray(body.lookingFor) ? (body.lookingFor as string[]).join(', ') : null
    const preferredAreas = Array.isArray(body.preferredAreas)
      ? (body.preferredAreas as string[]).join(', ')
      : null
    const contactPreference = Array.isArray(body.contactPreference)
      ? (body.contactPreference as string[]).join(', ')
      : null

    if (!name || name === 'Unknown') {
      return NextResponse.json({ error: 'name or firstName is required' }, { status: 400 })
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Build rich notes from all available registration data
    const notesParts = [
      userType ? `Type: ${userType}` : null,
      budget ? `Budget: ${budget}` : null,
      lookingFor ? `Looking for: ${lookingFor}` : null,
      preferredAreas ? `Areas: ${preferredAreas}` : null,
      contactPreference ? `Contact via: ${contactPreference}` : null,
      `Source: ${source}`,
    ].filter(Boolean)

    const db = getDb()

    // Parse budget string into min/max pence for CRM filtering
    let budgetMin: number | null = null
    let budgetMax: number | null = null
    if (budget) {
      const ranges: Record<string, [number, number]> = {
        'Under £100k':    [0,         10_000_000],
        '£100k–£250k':   [10_000_000, 25_000_000],
        '£250k–£500k':   [25_000_000, 50_000_000],
        '£500k–£1m':     [50_000_000, 100_000_000],
        'Over £1m':      [100_000_000, 999_999_999],
      }
      const match = ranges[budget]
      if (match) { budgetMin = match[0]; budgetMax = match[1] }
    }

    const [contact] = await db
      .insert(contacts)
      .values({
        name,
        email,
        phone: phone || null,
        contactType: 'investor',
        score: source === 'website_register' ? 55 : 35,
        status: 'warm',
        budgetMin,
        budgetMax,
        notes: notesParts.join(' | '),
      })
      .onConflictDoNothing()
      .returning()

    // Subscribe to newsletter
    const token = crypto.randomUUID().replace(/-/g, '')
    await db
      .insert(newsletterSubscribers)
      .values({
        email,
        name,
        status: 'confirmed',
        token,
        source,
        investorType: userType,
        confirmedAt: new Date(),
      })
      .onConflictDoNothing()

    await db.insert(activityLog).values({
      eventType: 'lead_investor_registration',
      description: `New investor registration: ${name} (${email}) via ${source}`,
      metadata: { name, email, phone, source, budget, lookingFor, preferredAreas },
    })

    void sendInvestorWelcome({ name, email })

    return NextResponse.json({ success: true, contactId: contact?.id ?? null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/intake/register-investor]', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
