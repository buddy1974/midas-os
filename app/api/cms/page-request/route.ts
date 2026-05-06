import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { pageName, description } = await req.json() as { pageName: string; description: string }

    if (!pageName) return NextResponse.json({ error: 'pageName required' }, { status: 400 })

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Midas OS <noreply@midaspropertyauctions.co.uk>',
          to: ['djstranger2000@gmail.com'],
          subject: `Page Request: ${pageName}`,
          html: `<h2>New Page / Feature Request</h2>
<p><strong>Requested by:</strong> ${session.user.name ?? session.user.email}</p>
<p><strong>Page / Feature:</strong> ${pageName}</p>
<p><strong>Description:</strong></p>
<p>${description ?? 'No description provided.'}</p>`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cms/page-request POST]', err)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
