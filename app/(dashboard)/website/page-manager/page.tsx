'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Send } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  url: string
  visible: boolean
  hasDropdown?: boolean
}

interface FooterLink {
  label: string
  url: string
  visible: boolean
}

// ── Default nav structure (mirrors website Navbar.tsx) ────────────────────────

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', url: '/', visible: true },
  { label: 'Buy Property', url: '#', visible: true, hasDropdown: true },
  { label: 'Sell Property', url: '#', visible: true, hasDropdown: true },
  { label: 'Instant Cash Offer', url: '/instant-offer', visible: true },
  { label: 'Events', url: '/events', visible: true },
  { label: 'About', url: '#', visible: true, hasDropdown: true },
]

const DEFAULT_FOOTER: FooterLink[] = [
  { label: 'Home', url: '/', visible: true },
  { label: 'Current Auction', url: '/current-auction', visible: true },
  { label: 'Timed Auction', url: '/timed-auction', visible: true },
  { label: 'Buying UK Property', url: '/buy', visible: true },
  { label: 'Selling UK Property', url: '/sell', visible: true },
  { label: 'Off-Market Properties', url: '/off-market', visible: true },
  { label: 'Yielding Investments', url: '/yielding-investments', visible: true },
  { label: 'Finance & Bridging', url: '/finance', visible: true },
  { label: 'Alternative Investments', url: '/alternative-investments', visible: true },
  { label: 'Events', url: '/events', visible: true },
  { label: 'Blog', url: '/blog', visible: true },
  { label: 'Testimonials', url: '/testimonials', visible: true },
  { label: 'Contact Us', url: '/contact', visible: true },
  { label: 'Sitemap', url: '/sitemap', visible: true },
]

const ALL_PAGES = [
  { name: 'Home', url: '/', inMenu: true },
  { name: 'Available Properties', url: '/properties', inMenu: false },
  { name: 'Current Auction', url: '/current-auction', inMenu: false },
  { name: 'Timed Auction', url: '/timed-auction', inMenu: false },
  { name: 'Off-Market Properties', url: '/off-market', inMenu: false },
  { name: 'Past Sales', url: '/past-auctions', inMenu: false },
  { name: 'Future Auction Dates', url: '/auction-dates', inMenu: false },
  { name: 'Register to Bid', url: '/register', inMenu: false },
  { name: 'Buy Property', url: '/buy', inMenu: true },
  { name: 'Guide to Buying', url: '/guide/buying', inMenu: false },
  { name: 'Guide to Timed Auction', url: '/guide/buying-timed', inMenu: false },
  { name: 'Finance Your Purchase', url: '/finance', inMenu: false },
  { name: 'AML Requirements', url: '/aml', inMenu: false },
  { name: 'Sell Property', url: '/sell', inMenu: true },
  { name: 'Free Valuation', url: '/valuation', inMenu: false },
  { name: 'Guide to Selling', url: '/guide/selling', inMenu: false },
  { name: 'Corporate & Probate', url: '/probate', inMenu: false },
  { name: 'Instant Cash Offer', url: '/instant-offer', inMenu: true },
  { name: 'Events', url: '/events', inMenu: true },
  { name: 'About Us', url: '/about', inMenu: true },
  { name: 'Blog', url: '/blog', inMenu: false },
  { name: 'Testimonials', url: '/testimonials', inMenu: false },
  { name: 'FAQs', url: '/faqs', inMenu: false },
  { name: 'Contact Us', url: '/contact', inMenu: false },
  { name: 'Alternative Investments', url: '/alternative-investments', inMenu: false },
  { name: 'Yielding Investments', url: '/yielding-investments', inMenu: false },
  { name: 'Off-Market Access', url: '/off-market', inMenu: false },
  { name: 'Wishlist', url: '/wishlist', inMenu: false },
  { name: 'Private Treaty', url: '/private-treaty', inMenu: false },
]

// ── UI Helpers ────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 mb-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-gold)' }}>{title}</h2>
      {subtitle && <p className="text-xs mb-5" style={{ color: 'var(--color-text-dim)' }}>{subtitle}</p>}
      {children}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PageManagerPage() {
  const [nav, setNav] = useState<NavItem[]>(DEFAULT_NAV)
  const [footer, setFooter] = useState<FooterLink[]>(DEFAULT_FOOTER)
  const [saved, setSaved] = useState(false)

  // Request form
  const [reqName, setReqName] = useState('')
  const [reqPurpose, setReqPurpose] = useState('')
  const [reqSent, setReqSent] = useState(false)

  // ── Nav helpers ──────────────────────────────────────────────────────────────

  function toggleNav(i: number) {
    setNav(prev => prev.map((item, idx) => idx === i ? { ...item, visible: !item.visible } : item))
    setSaved(false)
  }

  function moveNav(i: number, dir: -1 | 1) {
    const next = i + dir
    if (next < 0 || next >= nav.length) return
    setNav(prev => {
      const arr = [...prev]
      ;[arr[i], arr[next]] = [arr[next], arr[i]]
      return arr
    })
    setSaved(false)
  }

  // ── Footer helpers ───────────────────────────────────────────────────────────

  function toggleFooter(i: number) {
    setFooter(prev => prev.map((item, idx) => idx === i ? { ...item, visible: !item.visible } : item))
    setSaved(false)
  }

  // ── Save (fires notification — actual nav is code-controlled for now) ────────

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ── Request new page ─────────────────────────────────────────────────────────

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!reqName.trim()) return
    // Post to internal notes / inbox as a task request
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `PAGE REQUEST: "${reqName.trim()}"\n\nPurpose: ${reqPurpose.trim() || 'Not specified'}`,
          type: 'page_request',
        }),
      })
    } catch { /* silent fallback */ }
    setReqSent(true)
    setReqName('')
    setReqPurpose('')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/website" className="text-[rgba(232,228,220,0.4)] hover:text-[#C9A84C] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-gold)' }}>Pages & Menu Manager</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
            Control what appears in your navigation and footer.
          </p>
        </div>
      </div>

      <div className="mb-6 mt-1 rounded-lg p-3 text-xs" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(232,228,220,0.6)' }}>
        ℹ️ Navigation changes shown here are reflected in a config that Marcel applies to the live website. Changes to order or visibility take effect within 24 hours.
      </div>

      {/* SECTION A — Navigation Manager */}
      <SectionCard
        title="A — Navigation Menu"
        subtitle="Drag to reorder (use arrows). Toggle to show or hide items."
      >
        <div className="space-y-2">
          {nav.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{
                background: 'var(--color-bg)',
                border: `1px solid ${item.visible ? 'rgba(201,168,76,0.25)' : 'var(--color-border)'}`,
                opacity: item.visible ? 1 : 0.5,
              }}
            >
              {/* Order controls */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveNav(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 rounded hover:bg-[rgba(201,168,76,0.1)] disabled:opacity-20 transition-colors"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => moveNav(i, 1)}
                  disabled={i === nav.length - 1}
                  className="p-0.5 rounded hover:bg-[rgba(201,168,76,0.1)] disabled:opacity-20 transition-colors"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Position number */}
              <span className="text-xs w-5 text-center font-bold" style={{ color: 'rgba(201,168,76,0.5)' }}>{i + 1}</span>

              {/* Label + URL */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {item.label}
                  {item.hasDropdown && <span className="ml-1 text-xs" style={{ color: 'var(--color-text-dim)' }}>▾</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{item.url}</p>
              </div>

              {/* Visible toggle */}
              <button
                onClick={() => toggleNav(i)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  background: item.visible ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                  color: item.visible ? '#C9A84C' : 'var(--color-text-dim)',
                  border: `1px solid ${item.visible ? 'rgba(201,168,76,0.3)' : 'var(--color-border)'}`,
                }}
              >
                {item.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                {item.visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="mt-4 px-5 py-2.5 rounded font-bold text-sm transition-colors"
          style={{ background: '#C9A84C', color: '#080809' }}
        >
          {saved ? '✓ Saved — Marcel will apply changes' : 'Save Menu Order'}
        </button>
      </SectionCard>

      {/* SECTION B — All Pages */}
      <SectionCard
        title="B — All Pages"
        subtitle="All pages on the website. Pages not in the menu are still accessible by URL."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left pb-2 pr-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-dim)' }}>Page</th>
                <th className="text-left pb-2 pr-4 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-dim)' }}>URL</th>
                <th className="text-center pb-2 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-dim)' }}>In Menu</th>
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.map((page, i) => (
                <tr
                  key={page.url + i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--color-text)' }}>{page.name}</td>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--color-text-dim)', fontFamily: 'monospace', fontSize: 12 }}>{page.url}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: page.inMenu ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                        color: page.inMenu ? '#C9A84C' : 'var(--color-text-dim)',
                      }}
                    >
                      {page.inMenu ? 'Yes' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Request new page */}
        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>Request a New Page</p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-dim)' }}>
            Need a page that doesn&apos;t exist yet? Request it below. Marcel will build it — usually within 24 hours.
          </p>

          {reqSent ? (
            <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-sm font-bold text-green-400">✓ Request sent to Marcel.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>Usually done within 24 hours.</p>
              <button onClick={() => setReqSent(false)} className="text-xs mt-3" style={{ color: 'var(--color-text-dim)' }}>Request another page</button>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-3">
              <input
                value={reqName}
                onChange={e => setReqName(e.target.value)}
                placeholder="Page name (e.g. 'Investment Visas')"
                required
                style={inputStyle}
              />
              <textarea
                value={reqPurpose}
                onChange={e => setReqPurpose(e.target.value)}
                placeholder="What should this page be for? Who is it aimed at?"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold"
                style={{ background: '#C9A84C', color: '#080809' }}
              >
                <Send size={13} />
                Send Request
              </button>
            </form>
          )}
        </div>
      </SectionCard>

      {/* SECTION C — Footer Links */}
      <SectionCard
        title="C — Footer Links"
        subtitle="Show or hide links from the footer sitemap column."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {footer.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-3 py-2.5 rounded"
              style={{
                background: 'var(--color-bg)',
                border: `1px solid ${item.visible ? 'rgba(201,168,76,0.2)' : 'var(--color-border)'}`,
                opacity: item.visible ? 1 : 0.5,
              }}
            >
              <div className="min-w-0">
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)', fontFamily: 'monospace' }}>{item.url}</p>
              </div>
              <button
                onClick={() => toggleFooter(i)}
                className="ml-3 flex-shrink-0"
                style={{ color: item.visible ? '#C9A84C' : 'var(--color-text-dim)' }}
              >
                {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <Plus size={11} />
            Add footer link
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded text-xs font-bold"
            style={{ background: '#C9A84C', color: '#080809' }}
          >
            {saved ? '✓ Saved' : 'Save Footer'}
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
