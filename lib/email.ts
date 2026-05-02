/**
 * email.ts
 *
 * Lightweight Resend wrapper for transactional emails triggered by
 * intake endpoints (lead confirmations, team notifications).
 *
 * Does NOT use the Resend SDK — raw fetch keeps the bundle small and
 * avoids an extra dependency. Falls back silently if RESEND_API_KEY
 * is absent so intake routes never fail because of email issues.
 */

const RESEND_API = 'https://api.resend.com/emails'
const FROM = 'Midas Property Auctions <no-reply@midaspropertyauctions.co.uk>'
const TEAM_EMAIL = 'info@midaspropertygroup.co.uk'
const GOLD = '#C9A84C'

// ─── Low-level send ────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send')
    return false
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend error:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] fetch error:', err)
    return false
  }
}

// ─── Shared layout shell ───────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;background:#0a0a0a;">
  <div style="background:#000;padding:20px 32px;text-align:center;border-bottom:2px solid ${GOLD};">
    <span style="color:${GOLD};font-size:22px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">MIDAS</span>
  </div>
  <div style="padding:28px 32px;color:#c0c0c0;font-size:15px;line-height:1.7;">
    ${body}
  </div>
  <div style="padding:16px 32px;border-top:1px solid #1a1a1a;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">Midas Property Auctions Ltd &bull; info@midaspropertygroup.co.uk</p>
  </div>
</div>
</body>
</html>`
}

// ─── Pre-built email templates ─────────────────────────────────────────────

/** Sent to the user after they register interest in a specific lot */
export async function sendRegisterInterestConfirmation(params: {
  name: string
  email: string
  lotAddress: string
}) {
  const { name, email, lotAddress } = params
  await sendEmail({
    to: email,
    subject: `Interest Registered — ${lotAddress}`,
    html: wrap(`
      <p style="color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">✓ Interest Registered</p>
      <p>Dear ${name},</p>
      <p>Thank you for registering your interest in <strong style="color:${GOLD};">${lotAddress}</strong>.</p>
      <p>A member of the Midas team will be in contact within 24 hours with further information, including the legal pack, guide price updates and viewing availability.</p>
      <p style="margin-top:24px;">Kind regards,<br/>The Midas Property Auctions Team</p>
    `),
  })
}

/** Sent to the team when a new register-interest lead comes in */
export async function sendRegisterInterestAlert(params: {
  name: string
  email: string
  phone: string
  interest: string
  lotAddress: string
  lotId?: string
}) {
  const { name, email, phone, interest, lotAddress } = params
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `New Interest: ${lotAddress}`,
    replyTo: email || undefined,
    html: wrap(`
      <p style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">New Lead — Register Interest</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#888;padding:6px 0;width:120px;">Name</td><td style="color:#e0e0e0;">${name}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Email</td><td style="color:#e0e0e0;">${email || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Phone</td><td style="color:#e0e0e0;">${phone || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Interest as</td><td style="color:#e0e0e0;">${interest}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Property</td><td style="color:${GOLD};">${lotAddress}</td></tr>
      </table>
    `),
  })
}

/** Sent to the user after a finance enquiry */
export async function sendFinanceEnquiryConfirmation(params: {
  name: string
  email: string
}) {
  await sendEmail({
    to: params.email,
    subject: 'Finance Enquiry Received — Midas Property Auctions',
    html: wrap(`
      <p style="color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">✓ Enquiry Received</p>
      <p>Dear ${params.name},</p>
      <p>Thank you for your finance enquiry. A member of the Midas finance team will respond within <strong>24 hours</strong> with indicative terms.</p>
      <p>All enquiries are treated in strict confidence.</p>
      <p style="margin-top:24px;">Kind regards,<br/>The Midas Finance Team</p>
    `),
  })
}

/** Sent to the team when a new finance enquiry arrives */
export async function sendFinanceEnquiryAlert(params: {
  name: string
  email: string
  phone: string
  loanAmount?: string
  propertyValue?: string
  propertyAddress?: string
  purpose?: string
  term?: string
}) {
  const { name, email, phone, loanAmount, propertyValue, propertyAddress, purpose, term } = params
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `New Finance Enquiry — ${name}`,
    replyTo: email || undefined,
    html: wrap(`
      <p style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">New Lead — Finance Enquiry</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#888;padding:6px 0;width:140px;">Name</td><td style="color:#e0e0e0;">${name}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Email</td><td style="color:#e0e0e0;">${email || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Phone</td><td style="color:#e0e0e0;">${phone || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Loan Amount</td><td style="color:#e0e0e0;">${loanAmount || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Property Value</td><td style="color:#e0e0e0;">${propertyValue || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Property Address</td><td style="color:${GOLD};">${propertyAddress || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Purpose</td><td style="color:#e0e0e0;">${purpose || '—'}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Term</td><td style="color:#e0e0e0;">${term || '—'}</td></tr>
      </table>
    `),
  })
}

/** Sent to the user after a valuation request */
export async function sendValuationConfirmation(params: {
  name: string
  email: string
  address: string
}) {
  await sendEmail({
    to: params.email,
    subject: 'Valuation Request Received — Midas Property Auctions',
    html: wrap(`
      <p style="color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">✓ Request Received</p>
      <p>Dear ${params.name},</p>
      <p>Thank you for requesting a free appraisal for <strong style="color:${GOLD};">${params.address}</strong>.</p>
      <p>A member of the Midas team will be in touch within 24 hours to discuss how we can achieve the best result for your property.</p>
      <p style="margin-top:24px;">Kind regards,<br/>The Midas Property Auctions Team</p>
    `),
  })
}

/** Sent to the team for off-market access requests */
export async function sendOffmarketRequestAlert(params: {
  name: string
  email: string
}) {
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `Off-Market Access Request — ${params.name}`,
    replyTo: params.email || undefined,
    html: wrap(`
      <p style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">New Lead — Off-Market Access Request</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#888;padding:6px 0;width:120px;">Name</td><td style="color:#e0e0e0;">${params.name}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Email</td><td style="color:#e0e0e0;">${params.email}</td></tr>
      </table>
      <p style="margin-top:16px;color:#aaa;font-size:13px;">Qualify this investor and send them the off-market access code.</p>
    `),
  })
}

/** Sent to a newly registered investor */
export async function sendInvestorWelcome(params: {
  name: string
  email: string
}) {
  await sendEmail({
    to: params.email,
    subject: 'Welcome to the Midas Investor Network',
    html: wrap(`
      <p style="color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">✓ Registration Complete</p>
      <p>Dear ${params.name},</p>
      <p>Welcome to the <strong style="color:${GOLD};">Midas Investor Network</strong>.</p>
      <p>You will now receive early access to auction lots, off-market opportunities and exclusive investment content before they are publicly advertised.</p>
      <p>In the meantime, if you have a specific investment requirement or would like to discuss your criteria, reply to this email or call Sam directly on <strong>07454 753318</strong>.</p>
      <p style="margin-top:24px;">Kind regards,<br/>Sam Fongho<br/>Midas Property Auctions</p>
    `),
  })
}
