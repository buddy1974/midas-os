/**
 * intake-auth.ts
 *
 * Validates the x-api-key header on all public intake endpoints.
 * Set WEBSITE_API_KEY in OS env. Set the same value as MIDAS_OS_API_KEY
 * in the website env.
 *
 * Usage:
 *   const authError = requireIntakeKey(req)
 *   if (authError) return authError
 */

import { NextRequest, NextResponse } from 'next/server'

export function requireIntakeKey(req: NextRequest): NextResponse | null {
  const secret = process.env.WEBSITE_API_KEY
  if (!secret) {
    // If key isn't configured, block all intake requests in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[intake-auth] WEBSITE_API_KEY is not set — blocking request')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    // In development, allow through so local testing works without the key
    return null
  }

  const provided = req.headers.get('x-api-key')
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
