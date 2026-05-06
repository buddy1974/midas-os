import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/intake') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/newsletter/subscribe') ||
    pathname.startsWith('/api/newsletter/unsubscribe') ||
    (pathname.startsWith('/api/events') && req.method === 'GET')

  if (!isPublic && !req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
})

export const config = { matcher: '/api/:path*' }
