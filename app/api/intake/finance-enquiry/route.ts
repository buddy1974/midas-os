/**
 * POST /api/intake/finance-enquiry
 *
 * Handles finance enquiries from the website's /finance page
 * AND valuation requests from /valuation (both map here via source field).
 * Requires: x-api-key header matching WEBSITE_API_KEY env var.
 *
 * Actions:
 *  1. Upsert contact into CRM
 *  2. Create a loan application at status "enquiry" (finance source only)
 *  3. Log activity
 *  4. Send confirmation email to user
 *  5. Send alert to team
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { contacts, loanApplications, activityLog } from '@/lib/schema'
import { requireIntakeKey } from '@/lib/intake-auth'
import {
  sendFinanceEnquiryConfirmation,
  sendFinanceEnquiryAlert,
  sendValuationConfirmation,
} from '@/lib/email'

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

function parsePenceFromString(val: unknown): number | null {
  if (typeof val !== 'string' && typeof val !== 'number') return null
  const cleaned = String(val).replace(/[£,\s]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

export async function POST(req: NextRequest) {
  const authError = requireIntakeKey(req)
  if (authError) return authError

  try {
    const body = await req.json() as Record<string, unknown>

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const source = typeof body.source === 'string' ? body.source : 'website_finance'
    const isValuation = source === 'valuation_request'

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const propertyAddress =
      typeof body.propertyAddress === 'string'
        ? body.propertyAddress.trim()
        : typeof body.address === 'string'
        ? body.address.trim()
        : ''

    const loanAmountRaw = body.loanAmount ?? body.loan_amount
    const propertyValueRaw = body.propertyValue ?? body.property_value
    const purpose = typeof body.purpose === 'string' ? body.purpose : ''
    const term = typeof body.term === 'string' ? body.term : ''
    const situation = typeof body.situation === 'string' ? body.situation : ''
    const notes = typeof body.notes === 'string' ? body.notes : ''

    const loanAmountPence = parsePenceFromString(loanAmountRaw)
    const propertyValuePence = parsePenceFromString(propertyValueRaw)

    const db = getDb()

    // Upsert contact — use onConflictDoNothing so duplicate emails don't error
    const contactNotes = isValuation
      ? `Valuation request — ${propertyAddress}${situation ? ` | ${situation}` : ''}${notes ? ` | ${notes}` : ''}`
      : `Finance enquiry${propertyAddress ? ` — ${propertyAddress}` : ''}${purpose ? ` | ${purpose}` : ''}`

    const [contact] = await db
      .insert(contacts)
      .values({
        name,
        email: email || null,
        phone: phone || null,
        contactType: isValuation ? 'seller' : 'buyer',
        score: isValuation ? 50 : 60,
        status: 'warm',
        notes: contactNotes,
      })
      .onConflictDoNothing()
      .returning()

    // Create loan application record (finance enquiries only, not valuations)
    let applicationId: string | null = null
    if (!isValuation && loanAmountPence) {
      const [app] = await db
        .insert(loanApplications)
        .values({
          applicantName: name,
          applicantEmail: email || 'unknown@website.com',
          applicantPhone: phone || null,
          loanAmountPence,
          loanTermMonths: parseInt(term) || 12,
          propertyAddress: propertyAddress || 'Not provided',
          propertyValuePence: propertyValuePence ?? undefined,
          loanPurpose: purpose || null,
          status: 'enquiry',
          source: 'website',
        })
        .returning()
      applicationId = app?.id ?? null
    }

    await db.insert(activityLog).values({
      eventType: isValuation ? 'lead_valuation_request' : 'lead_finance_enquiry',
      description: `New ${isValuation ? 'valuation' : 'finance'} enquiry: ${name}${propertyAddress ? ` — ${propertyAddress}` : ''}`,
      metadata: {
        name,
        email,
        phone,
        source,
        propertyAddress,
        loanAmount: loanAmountRaw,
        applicationId,
      },
    })

    // Emails — fire-and-forget
    if (email) {
      if (isValuation) {
        void sendValuationConfirmation({ name, email, address: propertyAddress || 'your property' })
      } else {
        void sendFinanceEnquiryConfirmation({ name, email })
      }
    }
    void sendFinanceEnquiryAlert({
      name,
      email,
      phone,
      loanAmount: loanAmountRaw != null ? String(loanAmountRaw) : undefined,
      propertyValue: propertyValueRaw != null ? String(propertyValueRaw) : undefined,
      propertyAddress,
      purpose,
      term,
    })

    return NextResponse.json(
      { success: true, contactId: contact?.id ?? null, applicationId },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/intake/finance-enquiry]', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
