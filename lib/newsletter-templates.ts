export interface TemplateData {
  logoUrl?: string
  unsubscribeUrl?: string
  headline?: string
  heroImage?: string
  introText?: string
  lots?: Array<{ address: string; price: string; type: string; url: string }>
  ctaText?: string
  ctaUrl?: string
  bodyText?: string
  auctionName?: string
  auctionDate?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  month?: string
}

export type TemplateName =
  | 'new_lots'
  | 'auction_announcement'
  | 'market_update'
  | 'event_invitation'
  | 'monthly_digest'
  | 'welcome_email'

// ─── Shared helpers ──────────────────────────────────────────────────────────

function getHeader(logo: string): string {
  return `
<div style="background:#0D0D14;border-bottom:2px solid #C9A84C;padding:24px;text-align:center;">
  ${logo}
  <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:8px 0 0;">
    MIDAS PROPERTY AUCTIONS
  </p>
</div>`
}

function getFooter(unsubscribeUrl: string): string {
  return `
<div style="background:#0D0D14;border-top:1px solid rgba(201,168,76,0.2);padding:20px;text-align:center;">
  <p style="color:rgba(232,228,220,0.4);font-size:11px;line-height:1.6;margin:0;">
    Midas Property Group Ltd · Company No: 09522321<br/>
    Stanmore Business Centre, Honeypot Lane, London HA7 1BT<br/>
    <a href="${unsubscribeUrl}" style="color:rgba(201,168,76,0.6);">Unsubscribe</a> ·
    <a href="https://midas-website-rho.vercel.app/privacy" style="color:rgba(201,168,76,0.6);">Privacy Policy</a>
  </p>
</div>`
}

function ctaButton(text: string, url: string): string {
  return `
<div style="text-align:center;padding:24px;">
  <a href="${url}" style="display:inline-block;background:#C9A84C;color:#0D0D14;font-size:14px;font-weight:700;letter-spacing:0.08em;text-decoration:none;padding:14px 32px;border-radius:2px;">
    ${text}
  </a>
</div>`
}

// ─── Template body functions ──────────────────────────────────────────────────

function newLotsBody(data: TemplateData): string {
  const displayLots = (data.lots ?? []).slice(0, 4)

  // Pair into rows of 2
  const rows: string[] = []
  for (let i = 0; i < displayLots.length; i += 2) {
    const pair = displayLots.slice(i, i + 2)
    const cells = pair.map((lot) => `
<td style="width:50%;padding:6px;vertical-align:top;">
  <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:16px;">
    <p style="color:#E8E4DC;font-size:14px;font-weight:700;margin:0 0 6px;">${lot.address}</p>
    <p style="color:#C9A84C;font-size:16px;font-weight:900;margin:0 0 4px;">${lot.price}</p>
    <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">${lot.type}</p>
    <a href="${lot.url}" style="color:#C9A84C;font-size:12px;text-decoration:none;letter-spacing:0.05em;">View Lot →</a>
  </div>
</td>`).join('')
    const padded = pair.length < 2 ? cells + '<td style="width:50%;padding:6px;"></td>' : cells
    rows.push(`<tr>${padded}</tr>`)
  }

  return `
<div style="background:#C9A84C;padding:32px;text-align:center;">
  <h1 style="color:#0D0D14;font-size:26px;font-weight:900;letter-spacing:0.05em;margin:0 0 8px;">
    ${data.headline ?? 'New Auction Lots'}
  </h1>
  <p style="color:rgba(13,13,20,0.7);font-size:14px;margin:0;">
    ${data.introText ?? 'Fresh investment opportunities now live on the Midas platform.'}
  </p>
</div>

<div style="padding:16px;">
  <table style="width:100%;border-collapse:collapse;">
    ${rows.join('')}
  </table>
</div>

${ctaButton(data.ctaText ?? 'View All Current Lots', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/current-auction')}`
}

function auctionAnnouncementBody(data: TemplateData): string {
  const registerDeadline = data.auctionDate
    ? `Register before ${data.auctionDate}`
    : 'Register in advance to secure your place'

  return `
<div style="background:#0D0D14;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15);">
  <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 12px;">UPCOMING AUCTION</p>
  <h1 style="color:#E8E4DC;font-size:24px;font-weight:900;margin:0 0 16px;">
    ${data.auctionName ?? 'Midas Property Auction'}
  </h1>
  ${data.auctionDate ? `<p style="color:#C9A84C;font-size:28px;font-weight:900;letter-spacing:0.05em;margin:0 0 8px;">${data.auctionDate}</p>` : ''}
  <p style="color:rgba(232,228,220,0.6);font-size:13px;margin:0;">${registerDeadline}</p>
</div>

<div style="padding:32px;">
  <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 16px;text-align:center;">BIDDING OPTIONS</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:33%;padding:8px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:16px;">
          <p style="color:#C9A84C;font-size:18px;margin:0 0 4px;">🌐</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0;">Online Bidding</p>
        </div>
      </td>
      <td style="width:33%;padding:8px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:16px;">
          <p style="color:#C9A84C;font-size:18px;margin:0 0 4px;">📞</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0;">Telephone Bidding</p>
        </div>
      </td>
      <td style="width:33%;padding:8px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:16px;">
          <p style="color:#C9A84C;font-size:18px;margin:0 0 4px;">✉️</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0;">Proxy Bidding</p>
        </div>
      </td>
    </tr>
  </table>
</div>

${data.bodyText ? `<div style="padding:0 32px 24px;"><p style="color:rgba(232,228,220,0.7);font-size:14px;line-height:1.7;margin:0;">${data.bodyText}</p></div>` : ''}

${ctaButton(data.ctaText ?? 'Register to Bid Now', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/register')}`
}

function marketUpdateBody(data: TemplateData): string {
  return `
<div style="background:#13131F;padding:28px 32px;border-bottom:1px solid rgba(201,168,76,0.15);">
  <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 6px;">MARKET UPDATE</p>
  <h1 style="color:#E8E4DC;font-size:22px;font-weight:900;margin:0;">${data.month ?? 'Monthly'} Property Market Report</h1>
</div>

<div style="padding:24px 32px 8px;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;">
          <p style="color:#C9A84C;font-size:22px;font-weight:900;margin:0 0 4px;">24</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Lots Sold</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;">
          <p style="color:#C9A84C;font-size:22px;font-weight:900;margin:0 0 4px;">2,400+</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Subscribers</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;">
          <p style="color:#C9A84C;font-size:22px;font-weight:900;margin:0 0 4px;">94%</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Success Rate</p>
        </div>
      </td>
    </tr>
  </table>
</div>

${data.bodyText ? `
<div style="padding:16px 32px 8px;">
  <p style="color:rgba(232,228,220,0.75);font-size:14px;line-height:1.8;margin:0;">${data.bodyText}</p>
</div>` : ''}

<div style="padding:16px 32px 8px;">
  <a href="https://midas-website-rho.vercel.app/blog" style="text-decoration:none;">
    <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px;">
      <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">FROM THE BLOG</p>
      <p style="color:#E8E4DC;font-size:15px;font-weight:700;margin:0 0 8px;">Latest Insights from the Midas Team</p>
      <p style="color:#C9A84C;font-size:12px;margin:0;">Read more →</p>
    </div>
  </a>
</div>

${ctaButton(data.ctaText ?? 'Browse Investment Opportunities', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/current-auction')}`
}

function eventInvitationBody(data: TemplateData): string {
  let dayStr = ''
  let monthStr = ''
  if (data.eventDate) {
    const d = new Date(data.eventDate)
    if (!isNaN(d.getTime())) {
      dayStr = d.getDate().toString()
      monthStr = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
    } else {
      dayStr = data.eventDate
    }
  }

  return `
<div style="padding:32px;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:100px;vertical-align:top;">
        <div style="background:#C9A84C;padding:16px;text-align:center;border-radius:2px;">
          <p style="color:#0D0D14;font-size:32px;font-weight:900;margin:0;line-height:1;">${dayStr || '—'}</p>
          <p style="color:#0D0D14;font-size:12px;font-weight:700;letter-spacing:0.1em;margin:4px 0 0;">${monthStr}</p>
        </div>
      </td>
      <td style="padding-left:20px;vertical-align:top;">
        <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 8px;">YOU'RE INVITED</p>
        <h1 style="color:#E8E4DC;font-size:20px;font-weight:900;margin:0 0 10px;">${data.eventTitle ?? 'Midas Property Event'}</h1>
        ${data.eventDate ? `<p style="color:rgba(232,228,220,0.6);font-size:13px;margin:0 0 4px;">📅 ${data.eventDate}</p>` : ''}
        ${data.eventLocation ? `<p style="color:rgba(232,228,220,0.6);font-size:13px;margin:0;">📍 ${data.eventLocation}</p>` : ''}
      </td>
    </tr>
  </table>
</div>

${data.introText ? `
<div style="padding:0 32px 24px;">
  <p style="color:rgba(232,228,220,0.75);font-size:14px;line-height:1.8;margin:0;">${data.introText}</p>
</div>` : ''}

${ctaButton(data.ctaText ?? 'RSVP / Register Now', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/events')}`
}

function monthlyDigestBody(data: TemplateData): string {
  const displayLots = (data.lots ?? []).slice(0, 3)

  const lotRows = displayLots.map((lot) => `
<div style="background:#13131F;border:1px solid rgba(201,168,76,0.15);padding:14px 16px;margin-bottom:6px;display:table;width:100%;box-sizing:border-box;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="vertical-align:middle;">
        <p style="color:#E8E4DC;font-size:13px;font-weight:700;margin:0 0 2px;">${lot.address}</p>
        <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0;">${lot.type}</p>
      </td>
      <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
        <p style="color:#C9A84C;font-size:15px;font-weight:900;margin:0 0 4px;">${lot.price}</p>
        <a href="${lot.url}" style="color:rgba(201,168,76,0.7);font-size:11px;text-decoration:none;">View →</a>
      </td>
    </tr>
  </table>
</div>`).join('')

  return `
<div style="background:#13131F;padding:28px 32px;border-bottom:1px solid rgba(201,168,76,0.15);">
  <p style="color:rgba(232,228,220,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 6px;">MONTHLY DIGEST</p>
  <h1 style="color:#E8E4DC;font-size:22px;font-weight:900;margin:0;">${data.month ?? 'Property'} Digest</h1>
</div>

<div style="padding:24px 32px 8px;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:18px 8px;">
          <p style="color:#C9A84C;font-size:20px;font-weight:900;margin:0 0 4px;">${(data.lots ?? []).length}</p>
          <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Active Lots</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:18px 8px;">
          <p style="color:#C9A84C;font-size:20px;font-weight:900;margin:0 0 4px;">94%</p>
          <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Success Rate</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:18px 8px;">
          <p style="color:#C9A84C;font-size:20px;font-weight:900;margin:0 0 4px;">2,400+</p>
          <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Investors</p>
        </div>
      </td>
    </tr>
  </table>
</div>

${displayLots.length > 0 ? `
<div style="padding:8px 32px 8px;">
  <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 10px;">FEATURED LOTS</p>
  ${lotRows}
</div>` : ''}

${data.bodyText ? `
<div style="padding:8px 32px 16px;">
  <p style="color:rgba(232,228,220,0.75);font-size:14px;line-height:1.8;margin:0;">${data.bodyText}</p>
</div>` : ''}

${data.auctionDate ? `
<div style="margin:8px 32px 8px;background:#13131F;border-left:3px solid #C9A84C;padding:16px 20px;">
  <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px;">NEXT AUCTION</p>
  <p style="color:#C9A84C;font-size:16px;font-weight:900;margin:0;">${data.auctionDate}</p>
</div>` : ''}

${ctaButton(data.ctaText ?? 'View Full Catalogue', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/current-auction')}`
}

function welcomeEmailBody(data: TemplateData): string {
  return `
<div style="background:#C9A84C;padding:40px 32px;text-align:center;">
  <p style="color:rgba(13,13,20,0.6);font-size:11px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 10px;">WELCOME</p>
  <h1 style="color:#0D0D14;font-size:22px;font-weight:900;line-height:1.3;margin:0;">
    Welcome to the<br/>Midas Investor Network
  </h1>
</div>

<div style="padding:24px 32px 8px;">
  <p style="color:rgba(232,228,220,0.7);font-size:14px;line-height:1.8;margin:0 0 24px;text-align:center;">
    ${data.introText ?? 'You now have access to exclusive auction lots, off-market properties, and bridging finance solutions tailored for serious investors.'}
  </p>

  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:33%;padding:6px;text-align:center;vertical-align:top;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;height:100%;">
          <p style="color:#C9A84C;font-size:20px;margin:0 0 8px;">🏠</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0 0 6px;">Current Auction Lots</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;line-height:1.5;margin:0;">Browse residential &amp; commercial lots across London and Essex</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;vertical-align:top;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;height:100%;">
          <p style="color:#C9A84C;font-size:20px;margin:0 0 8px;">🔑</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0 0 6px;">Off-Market Properties</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;line-height:1.5;margin:0;">Exclusive deals not listed publicly — for registered investors only</p>
        </div>
      </td>
      <td style="width:33%;padding:6px;text-align:center;vertical-align:top;">
        <div style="background:#13131F;border:1px solid rgba(201,168,76,0.2);padding:20px 12px;height:100%;">
          <p style="color:#C9A84C;font-size:20px;margin:0 0 8px;">💼</p>
          <p style="color:#E8E4DC;font-size:12px;font-weight:700;margin:0 0 6px;">Bridging Finance</p>
          <p style="color:rgba(232,228,220,0.5);font-size:11px;line-height:1.5;margin:0;">Fast, flexible funding solutions to complete your purchase</p>
        </div>
      </td>
    </tr>
  </table>
</div>

<div style="margin:8px 32px 24px;border:1px solid #C9A84C;padding:20px;">
  <p style="color:rgba(232,228,220,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px;">OFF-MARKET ACCESS</p>
  <p style="color:#E8E4DC;font-size:14px;font-weight:700;margin:0 0 6px;">Unlock Exclusive Deals Before They Go Public</p>
  <p style="color:rgba(232,228,220,0.6);font-size:13px;line-height:1.6;margin:0;">
    As a registered investor, you'll receive early access to off-market opportunities sourced directly by the Midas team — before they're listed anywhere else.
  </p>
</div>

${ctaButton(data.ctaText ?? 'Register as an Investor', data.ctaUrl ?? 'https://midas-website-rho.vercel.app/register')}`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function renderTemplate(name: TemplateName, data: TemplateData): string {
  const logo = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="Midas" style="height:50px;" />`
    : '<p style="color:#C9A84C;font-size:20px;font-weight:900;letter-spacing:0.15em;margin:0;">◆ MPG</p>'

  const unsubscribe =
    data.unsubscribeUrl ?? 'https://midas-property-sam.vercel.app/api/newsletter/unsubscribe'

  const withLayout = (content: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080809;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#080809;">
  ${getHeader(logo)}
  ${content}
  ${getFooter(unsubscribe)}
</div>
</body>
</html>`

  switch (name) {
    case 'new_lots':
      return withLayout(newLotsBody(data))
    case 'auction_announcement':
      return withLayout(auctionAnnouncementBody(data))
    case 'market_update':
      return withLayout(marketUpdateBody(data))
    case 'event_invitation':
      return withLayout(eventInvitationBody(data))
    case 'monthly_digest':
      return withLayout(monthlyDigestBody(data))
    case 'welcome_email':
      return withLayout(welcomeEmailBody(data))
  }
}
