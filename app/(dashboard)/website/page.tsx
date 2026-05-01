'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Globe, Settings, CalendarDays, ToggleLeft, ToggleRight, ExternalLink,
  Gavel, FileText, Users, BookOpen, Star, Plus, Trash2, Save,
  ChevronDown, ChevronUp, Eye, EyeOff, X,
} from 'lucide-react'

const WEBSITE_URL = 'https://midas-website-rho.vercel.app'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Lot {
  id: string
  address: string
  guidePrice: number
  pipelineStage: string
  showOnWebsite: boolean
  isOffMarket: boolean
}

interface Event {
  id: string
  title: string
  eventType: string
  eventDate: string
  location: string | null
  showOnWebsite: boolean
}

interface TeamMemberRow {
  id: string
  name: string
  role: string
  initials: string
  bio: string
  phone: string
  email: string
  linkedin: string
  photoUrl: string
  isActive: boolean
  showOnWebsite: boolean
  sortOrder: number
}

interface BlogPostRow {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

interface TestimonialRow {
  id: string
  name: string
  location: string
  text: string
  rating: number
  isActive: boolean
  source: string
  sortOrder: number
}

type Tab = 'auction' | 'lots' | 'content' | 'team' | 'blog' | 'testimonials' | 'events' | 'settings'

type ContentSubTab = 'Homepage' | 'Sell' | 'Finance' | 'About'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'auction',      label: 'Auction',      icon: Gavel },
  { id: 'lots',         label: 'Properties',   icon: Globe },
  { id: 'content',      label: 'Content',      icon: FileText },
  { id: 'team',         label: 'Team',         icon: Users },
  { id: 'blog',         label: 'Blog',         icon: BookOpen },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'events',       label: 'Events',       icon: CalendarDays },
  { id: 'settings',     label: 'Settings',     icon: Settings },
]

const WEBSITE_LINKS: [string, string][] = [
  ['Homepage', '/'],
  ['Properties', '/properties'],
  ['Off-Market', '/off-market'],
  ['Finance', '/finance'],
  ['Events', '/events'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Register', '/register'],
  ['Compare', '/compare'],
  ['Loan Application', 'https://os.midaspropertyauctions.co.uk/loans/apply'],
]

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pence)
}

function useToast() {
  const [toast, setToast] = useState('')
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])
  return { toast, showToast }
}

// ─── Reusable UI components ──────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-xl"
      style={{ backgroundColor: '#C9A84C', color: '#080809' }}
    >
      {message}
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
  const Icon = checked ? ToggleRight : ToggleLeft
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: checked ? '#C9A84C' : 'var(--color-text-dim)' }}
    >
      <Icon size={22} />
    </button>
  )
}

function SettingsField({
  label, value, onChange, type, placeholder, helper,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
        {label}
      </label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />
      {helper && <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{helper}</p>}
    </div>
  )
}

function TextareaField({
  label, value, onChange, placeholder, rows, helper,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 resize-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />
      {helper && <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{helper}</p>}
    </div>
  )
}

function SaveButton({
  onClick, saving, saved, label = 'Save',
}: {
  onClick: () => void
  saving?: boolean
  saved?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50"
      style={{ backgroundColor: '#C9A84C', color: '#080809' }}
    >
      <Save size={14} />
      {saving ? 'Saving...' : saved ? 'Saved ✓' : label}
    </button>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-5 space-y-4 ${className}`}
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  )
}

function InfoBanner() {
  return (
    <div
      className="rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
      style={{ border: '1px solid rgba(201,168,76,0.35)', backgroundColor: 'rgba(201,168,76,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <Globe size={16} style={{ color: '#C9A84C', marginTop: '2px', flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(232,228,220,0.75)' }}>
          Toggling a lot <strong style={{ color: '#C9A84C' }}>ON</strong> makes it live on{' '}
          <span style={{ color: '#C9A84C' }}>midas-website-rho.vercel.app/properties</span> within 60 seconds. No code needed.
        </p>
      </div>
      <a
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-75"
        style={{ color: '#C9A84C' }}
      >
        View website <ExternalLink size={12} />
      </a>
    </div>
  )
}

// ─── TAB 1: AUCTION ──────────────────────────────────────────────────────────

function AuctionTab() {
  const { toast, showToast } = useToast()

  const [fields, setFields] = useState({
    auction_next_name: 'Midas Spring Auction 2026',
    auction_next_date: '2026-05-14T12:00:00',
    auction_next_lots: '12',
    auction_catalogue_pdf: '',
    auction_livestream_url: '',
    offmarket_password: 'MIDAS2026',
    stat_1_value: '340+',
    stat_1_label: 'Properties Sold',
    stat_2_value: '2,847',
    stat_2_label: 'Active Investors',
    stat_3_value: '15+',
    stat_3_label: 'Years Experience',
    stat_4_value: '28',
    stat_4_label: 'Days to Completion',
  })

  const [savingCard, setSavingCard] = useState<string | null>(null)
  const [savedCard, setSavedCard] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const set = (key: keyof typeof fields) => (v: string) =>
    setFields(prev => ({ ...prev, [key]: v }))

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/public/config')
        if (!res.ok) return
        const data = await res.json() as { config: Record<string, string> }
        const c = data.config
        setFields(prev => ({
          ...prev,
          auction_next_name:     c['auction.next_name']      ?? prev.auction_next_name,
          auction_next_date:     c['auction.next_date']      ?? prev.auction_next_date,
          auction_next_lots:     c['auction.next_lots']      ?? prev.auction_next_lots,
          auction_catalogue_pdf: c['auction.catalogue_pdf']  ?? prev.auction_catalogue_pdf,
          auction_livestream_url:c['auction.livestream_url'] ?? prev.auction_livestream_url,
          offmarket_password:    c['offmarket.password']     ?? prev.offmarket_password,
          stat_1_value:          c['home.stat_1_value']      ?? prev.stat_1_value,
          stat_1_label:          c['home.stat_1_label']      ?? prev.stat_1_label,
          stat_2_value:          c['home.stat_2_value']      ?? prev.stat_2_value,
          stat_2_label:          c['home.stat_2_label']      ?? prev.stat_2_label,
          stat_3_value:          c['home.stat_3_value']      ?? prev.stat_3_value,
          stat_3_label:          c['home.stat_3_label']      ?? prev.stat_3_label,
          stat_4_value:          c['home.stat_4_value']      ?? prev.stat_4_value,
          stat_4_label:          c['home.stat_4_label']      ?? prev.stat_4_label,
        }))
      } catch {
        // silently ignore
      }
    })()
  }, [])

  async function saveCard(cardId: string, payload: Record<string, string>) {
    setSavingCard(cardId)
    try {
      const res = await fetch('/api/public/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSavedCard(cardId)
      showToast('Saved ✓')
      setTimeout(() => setSavedCard(null), 2000)
    } catch {
      showToast('Save failed')
    } finally {
      setSavingCard(null)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Toast message={toast} />

      {/* Card 1: Auction Details */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Auction Details</h3>
        <SettingsField
          label="Auction Name"
          value={fields.auction_next_name}
          onChange={set('auction_next_name')}
          placeholder="Midas Spring Auction 2026"
        />
        <SettingsField
          label="Date & Time"
          value={fields.auction_next_date}
          onChange={set('auction_next_date')}
          type="datetime-local"
          helper="This updates the countdown on the website instantly"
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
            Number of Lots
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => set('auction_next_lots')(String(Math.max(0, parseInt(fields.auction_next_lots, 10) - 1)))}
              className="w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              −
            </button>
            <input
              type="number"
              value={fields.auction_next_lots}
              onChange={e => set('auction_next_lots')(e.target.value)}
              className="w-20 px-3 py-2 rounded-md text-sm outline-none text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <button
              onClick={() => set('auction_next_lots')(String(parseInt(fields.auction_next_lots, 10) + 1))}
              className="w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              +
            </button>
          </div>
        </div>
        <SaveButton
          onClick={() => void saveCard('details', {
            'auction.next_name': fields.auction_next_name,
            'auction.next_date': fields.auction_next_date,
            'auction.next_lots': fields.auction_next_lots,
          })}
          saving={savingCard === 'details'}
          saved={savedCard === 'details'}
          label="Save Auction Details"
        />
      </Card>

      {/* Card 2: Links & Access */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Links & Access</h3>
        <SettingsField
          label="Catalogue PDF URL"
          value={fields.auction_catalogue_pdf}
          onChange={set('auction_catalogue_pdf')}
          type="url"
          placeholder="https://..."
          helper="Appears as 'Download Catalogue' button"
        />
        <SettingsField
          label="Livestream URL"
          value={fields.auction_livestream_url}
          onChange={set('auction_livestream_url')}
          type="url"
          placeholder="https://youtube.com/..."
          helper="Add when auction goes live — appears as 'Watch Live' button"
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
            Off-Market Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={fields.offmarket_password}
              onChange={e => set('offmarket_password')(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-md text-sm outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <button
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-dim)' }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <SaveButton
          onClick={() => void saveCard('links', {
            'auction.catalogue_pdf':   fields.auction_catalogue_pdf,
            'auction.livestream_url':  fields.auction_livestream_url,
            'offmarket.password':      fields.offmarket_password,
          })}
          saving={savingCard === 'links'}
          saved={savedCard === 'links'}
          label="Save Links & Access"
        />
      </Card>

      {/* Card 3: Website Stats */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Website Stats</h3>
        <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>Shown in the stats bar on the homepage</p>
        {(
          [
            { vk: 'stat_1_value', lk: 'stat_1_label', vph: '340+',  lph: 'Properties Sold' },
            { vk: 'stat_2_value', lk: 'stat_2_label', vph: '2,847', lph: 'Active Investors' },
            { vk: 'stat_3_value', lk: 'stat_3_label', vph: '15+',   lph: 'Years Experience' },
            { vk: 'stat_4_value', lk: 'stat_4_label', vph: '28',    lph: 'Days to Completion' },
          ] as Array<{ vk: keyof typeof fields; lk: keyof typeof fields; vph: string; lph: string }>
        ).map(({ vk, lk, vph, lph }) => (
          <div key={vk} className="grid grid-cols-2 gap-3">
            <SettingsField label="Value" value={fields[vk]} onChange={set(vk)} placeholder={vph} />
            <SettingsField label="Label" value={fields[lk]} onChange={set(lk)} placeholder={lph} />
          </div>
        ))}
        <SaveButton
          onClick={() => void saveCard('stats', {
            'home.stat_1_value': fields.stat_1_value,
            'home.stat_1_label': fields.stat_1_label,
            'home.stat_2_value': fields.stat_2_value,
            'home.stat_2_label': fields.stat_2_label,
            'home.stat_3_value': fields.stat_3_value,
            'home.stat_3_label': fields.stat_3_label,
            'home.stat_4_value': fields.stat_4_value,
            'home.stat_4_label': fields.stat_4_label,
          })}
          saving={savingCard === 'stats'}
          saved={savedCard === 'stats'}
          label="Save Stats"
        />
      </Card>
    </div>
  )
}

// ─── TAB 2: LOTS ─────────────────────────────────────────────────────────────

function LotsTab() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast, showToast } = useToast()

  const fetchLots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lots')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as Lot[]
      setLots(data)
    } catch {
      // empty state shown below
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchLots() }, [fetchLots])

  const handleToggle = async (lot: Lot, field: 'showOnWebsite' | 'isOffMarket') => {
    const key = `${lot.id}:${field}`
    setSaving(key)
    try {
      const res = await fetch(`/api/lots/${lot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !lot[field] }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setLots(prev => prev.map(l => l.id === lot.id ? { ...l, [field]: !l[field] } : l))
      showToast('Website updated ✓')
    } catch {
      showToast('Update failed')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading lots...</p>
      </div>
    )
  }

  return (
    <div>
      <Toast message={toast} />
      <InfoBanner />

      {lots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Globe size={32} style={{ color: 'var(--color-text-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No lots found. Add lots in Pipeline first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="grid items-center gap-4 px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--color-text-dim)', fontSize: '10px', gridTemplateColumns: '1fr auto auto auto auto' }}
          >
            <span>Lot</span>
            <span className="w-24 text-center">Stage</span>
            <span className="w-28 text-center">Show on Website</span>
            <span className="w-24 text-center">Off-Market</span>
            <span className="w-20 text-center">Preview</span>
          </div>

          {lots.map(lot => {
            const savingWebsite = saving === `${lot.id}:showOnWebsite`
            const savingMarket  = saving === `${lot.id}:isOffMarket`
            return (
              <div
                key={lot.id}
                className="grid items-center gap-4 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: `1px solid ${lot.showOnWebsite ? 'rgba(201,168,76,0.3)' : 'var(--color-border)'}`,
                  gridTemplateColumns: '1fr auto auto auto auto',
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{lot.address}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    {formatPrice(lot.guidePrice)}
                    {lot.isOffMarket && <span className="ml-2 text-[#C9A84C]">🔐 off-market</span>}
                  </p>
                </div>

                <div className="w-24 text-center">
                  <span
                    className="text-xs px-2 py-0.5 rounded capitalize"
                    style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                  >
                    {lot.pipelineStage.replace('_', ' ')}
                  </span>
                </div>

                <div className="w-28 flex flex-col items-center gap-1">
                  <Toggle
                    checked={lot.showOnWebsite}
                    onChange={() => void handleToggle(lot, 'showOnWebsite')}
                    disabled={savingWebsite}
                  />
                  {savingWebsite && (
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
                  )}
                </div>

                <div className="w-24 flex flex-col items-center gap-1">
                  <Toggle
                    checked={lot.isOffMarket}
                    onChange={() => void handleToggle(lot, 'isOffMarket')}
                    disabled={savingMarket}
                  />
                  {savingMarket && (
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
                  )}
                </div>

                <div className="w-20 flex justify-center">
                  <a
                    href={`${WEBSITE_URL}/properties/${lot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75"
                    style={{ color: lot.showOnWebsite ? '#C9A84C' : 'var(--color-text-dim)' }}
                  >
                    Preview <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB 3: CONTENT ──────────────────────────────────────────────────────────

const CONTENT_SUB_TABS: ContentSubTab[] = ['Homepage', 'Sell', 'Finance', 'About']

interface ContentFields {
  home_hero_eyebrow:  string
  home_hero_heading_1: string
  home_hero_heading_2: string
  home_hero_subtitle:  string
  sell_fee_text:       string
  sell_success_rate:   string
  finance_headline:    string
  finance_rate_from:   string
  finance_min_loan:    string
  finance_max_loan:    string
  about_company_story: string
  about_mission:       string
}

function ContentTab() {
  const { toast, showToast } = useToast()
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTab>('Homepage')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fields, setFields] = useState<ContentFields>({
    home_hero_eyebrow:   '',
    home_hero_heading_1: '',
    home_hero_heading_2: '',
    home_hero_subtitle:  '',
    sell_fee_text:       '',
    sell_success_rate:   '',
    finance_headline:    '',
    finance_rate_from:   '',
    finance_min_loan:    '',
    finance_max_loan:    '',
    about_company_story: '',
    about_mission:       '',
  })

  const set = (key: keyof ContentFields) => (v: string) =>
    setFields(prev => ({ ...prev, [key]: v }))

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/public/config')
        if (!res.ok) return
        const data = await res.json() as { config: Record<string, string> }
        const c = data.config
        setFields(prev => ({
          ...prev,
          home_hero_eyebrow:   c['home.hero_eyebrow']   ?? prev.home_hero_eyebrow,
          home_hero_heading_1: c['home.hero_heading_1'] ?? prev.home_hero_heading_1,
          home_hero_heading_2: c['home.hero_heading_2'] ?? prev.home_hero_heading_2,
          home_hero_subtitle:  c['home.hero_subtitle']  ?? prev.home_hero_subtitle,
          sell_fee_text:       c['sell.fee_text']       ?? prev.sell_fee_text,
          sell_success_rate:   c['sell.success_rate']   ?? prev.sell_success_rate,
          finance_headline:    c['finance.headline']    ?? prev.finance_headline,
          finance_rate_from:   c['finance.rate_from']   ?? prev.finance_rate_from,
          finance_min_loan:    c['finance.min_loan']    ?? prev.finance_min_loan,
          finance_max_loan:    c['finance.max_loan']    ?? prev.finance_max_loan,
          about_company_story: c['about.company_story'] ?? prev.about_company_story,
          about_mission:       c['about.mission']       ?? prev.about_mission,
        }))
      } catch {
        // ignore
      }
    })()
  }, [])

  const payloadForSubTab: Record<ContentSubTab, Record<string, string>> = {
    Homepage: {
      'home.hero_eyebrow':   fields.home_hero_eyebrow,
      'home.hero_heading_1': fields.home_hero_heading_1,
      'home.hero_heading_2': fields.home_hero_heading_2,
      'home.hero_subtitle':  fields.home_hero_subtitle,
    },
    Sell: {
      'sell.fee_text':     fields.sell_fee_text,
      'sell.success_rate': fields.sell_success_rate,
    },
    Finance: {
      'finance.headline':  fields.finance_headline,
      'finance.rate_from': fields.finance_rate_from,
      'finance.min_loan':  fields.finance_min_loan,
      'finance.max_loan':  fields.finance_max_loan,
    },
    About: {
      'about.company_story': fields.about_company_story,
      'about.mission':       fields.about_mission,
    },
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/public/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForSubTab[activeSubTab]),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      showToast('Content saved ✓')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      showToast('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Toast message={toast} />

      {/* Sub-tab pills */}
      <div className="flex gap-1">
        {CONTENT_SUB_TABS.map(sub => {
          const active = activeSubTab === sub
          return (
            <button
              key={sub}
              onClick={() => setActiveSubTab(sub)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: active ? '#C9A84C' : 'var(--color-text-dim)',
                border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
              }}
            >
              {sub}
            </button>
          )
        })}
      </div>

      <Card>
        {activeSubTab === 'Homepage' && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Homepage Content</h3>
            <SettingsField label="Hero Eyebrow" value={fields.home_hero_eyebrow} onChange={set('home_hero_eyebrow')} placeholder="Trusted Property Auction Specialists" />
            <SettingsField label="Hero Heading Line 1" value={fields.home_hero_heading_1} onChange={set('home_hero_heading_1')} placeholder="Sell Your Property" />
            <SettingsField label="Hero Heading Line 2" value={fields.home_hero_heading_2} onChange={set('home_hero_heading_2')} placeholder="At Auction" />
            <TextareaField label="Hero Subtitle" value={fields.home_hero_subtitle} onChange={set('home_hero_subtitle')} placeholder="Fast, transparent, guaranteed..." />
          </>
        )}

        {activeSubTab === 'Sell' && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sell Page Content</h3>
            <TextareaField label="Selling Fee Description" value={fields.sell_fee_text} onChange={set('sell_fee_text')} placeholder="Our competitive fee structure..." />
            <SettingsField label="Success Rate" value={fields.sell_success_rate} onChange={set('sell_success_rate')} placeholder="98%" />
          </>
        )}

        {activeSubTab === 'Finance' && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Finance Page Content</h3>
            <SettingsField label="Headline" value={fields.finance_headline} onChange={set('finance_headline')} placeholder="Fast Bridging Finance" />
            <SettingsField label="Rate From" value={fields.finance_rate_from} onChange={set('finance_rate_from')} placeholder="0.75% pm" />
            <SettingsField label="Min Loan" value={fields.finance_min_loan} onChange={set('finance_min_loan')} placeholder="£50,000" />
            <SettingsField label="Max Loan" value={fields.finance_max_loan} onChange={set('finance_max_loan')} placeholder="£5,000,000" />
          </>
        )}

        {activeSubTab === 'About' && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>About Page Content</h3>
            <TextareaField label="Company Story" value={fields.about_company_story} onChange={set('about_company_story')} rows={5} placeholder="Midas Property Auctions was founded..." />
            <TextareaField label="Mission Statement" value={fields.about_mission} onChange={set('about_mission')} placeholder="Our mission is to..." />
          </>
        )}

        <SaveButton
          onClick={() => void handleSave()}
          saving={saving}
          saved={saved}
          label={`Save ${activeSubTab} Content`}
        />
      </Card>
    </div>
  )
}

// ─── TAB 4: TEAM ─────────────────────────────────────────────────────────────

function TeamTab() {
  const { toast, showToast } = useToast()
  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', role: '', bio: '' })
  const [addingMember, setAddingMember] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, Partial<TeamMemberRow>>>({})

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cms/team')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json() as TeamMemberRow[]
      setMembers(data)
    } catch {
      showToast('Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void fetchMembers() }, [fetchMembers])

  function getEdit(id: string): Partial<TeamMemberRow> {
    return editFields[id] ?? {}
  }

  function setEdit(id: string, key: keyof TeamMemberRow, value: string | boolean | number) {
    setEditFields(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }))
  }

  async function handleAdd() {
    if (!newMember.name.trim()) return
    setAddingMember(true)
    try {
      const res = await fetch('/api/cms/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      if (!res.ok) throw new Error('Failed to add')
      await fetchMembers()
      setNewMember({ name: '', role: '', bio: '' })
      setShowAdd(false)
      showToast('Team member added ✓')
    } catch {
      showToast('Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleToggleVisible(member: TeamMemberRow) {
    try {
      const res = await fetch(`/api/cms/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnWebsite: !member.showOnWebsite }),
      })
      if (!res.ok) throw new Error('Failed')
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, showOnWebsite: !m.showOnWebsite } : m))
    } catch {
      showToast('Update failed')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/cms/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchMembers()
      showToast('Member removed ✓')
    } catch {
      showToast('Delete failed')
    }
  }

  async function handleSaveMember(member: TeamMemberRow) {
    setSavingId(member.id)
    const edits = getEdit(member.id)
    try {
      const res = await fetch(`/api/cms/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchMembers()
      setExpandedId(null)
      showToast('Changes saved ✓')
    } catch {
      showToast('Save failed')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading team...</p>
      </div>
    )
  }

  const activeMembers = members.filter(m => m.isActive)

  return (
    <div className="space-y-4 max-w-2xl">
      <Toast message={toast} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Team Members · {activeMembers.length} active
        </p>
        <button
          onClick={() => setShowAdd(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Cancel' : 'Add Team Member'}
        </button>
      </div>

      {showAdd && (
        <Card>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>New Team Member</h3>
          <SettingsField label="Name" value={newMember.name} onChange={v => setNewMember(p => ({ ...p, name: v }))} placeholder="Sam Fongho" />
          <SettingsField label="Role" value={newMember.role} onChange={v => setNewMember(p => ({ ...p, role: v }))} placeholder="Director" />
          <TextareaField label="Bio" value={newMember.bio} onChange={v => setNewMember(p => ({ ...p, bio: v }))} placeholder="Brief biography..." />
          <button
            onClick={() => void handleAdd()}
            disabled={addingMember || !newMember.name.trim()}
            className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C', color: '#080809' }}
          >
            {addingMember ? 'Adding...' : 'Add Member'}
          </button>
        </Card>
      )}

      <div className="space-y-2">
        {activeMembers.map(member => {
          const expanded = expandedId === member.id
          const edits = getEdit(member.id)
          const merged = { ...member, ...edits }
          return (
            <div
              key={member.id}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#C9A84C', color: '#080809' }}
                >
                  {member.initials || member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{member.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-dim)' }}>{member.role}</p>
                </div>
                <div className="flex items-center gap-1 mr-2">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>Website</span>
                  <Toggle checked={member.showOnWebsite} onChange={() => void handleToggleVisible(member)} disabled={false} />
                </div>
                <button
                  onClick={() => void handleDelete(member.id)}
                  className="p-1.5 rounded transition-opacity hover:opacity-75"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setExpandedId(expanded ? null : member.id)}
                  className="p-1.5 rounded transition-opacity hover:opacity-75"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expanded edit body */}
              {expanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <TextareaField label="Bio" value={merged.bio} onChange={v => setEdit(member.id, 'bio', v)} rows={3} />
                    <div className="space-y-3">
                      <SettingsField label="Phone" value={merged.phone} onChange={v => setEdit(member.id, 'phone', v)} placeholder="+44..." />
                      <SettingsField label="Email" value={merged.email} onChange={v => setEdit(member.id, 'email', v)} placeholder="name@..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SettingsField label="LinkedIn" value={merged.linkedin} onChange={v => setEdit(member.id, 'linkedin', v)} placeholder="https://linkedin.com/in/..." />
                    <SettingsField label="Photo URL" value={merged.photoUrl} onChange={v => setEdit(member.id, 'photoUrl', v)} placeholder="https://..." />
                  </div>
                  <div className="flex gap-2">
                    <SaveButton
                      onClick={() => void handleSaveMember(member)}
                      saving={savingId === member.id}
                      label="Save Changes"
                    />
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-4 py-2 rounded-md text-sm font-semibold"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TAB 5: BLOG ─────────────────────────────────────────────────────────────

const BLOG_CATEGORIES = ['Guide', 'Investment', 'Finance', 'Market', 'News'] as const
type BlogCategory = typeof BLOG_CATEGORIES[number]

function BlogTab() {
  const { toast, showToast } = useToast()
  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', category: 'Guide' as BlogCategory, excerpt: '', content: '', isPublished: false })
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, Partial<BlogPostRow>>>({})

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cms/posts')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json() as BlogPostRow[]
      setPosts(data)
    } catch {
      showToast('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void fetchPosts() }, [fetchPosts])

  function getEdit(id: string): Partial<BlogPostRow> {
    return editFields[id] ?? {}
  }

  function setEdit(id: string, key: keyof BlogPostRow, value: string | boolean | null) {
    setEditFields(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  async function handleCreate() {
    if (!newPost.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/cms/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchPosts()
      setNewPost({ title: '', category: 'Guide', excerpt: '', content: '', isPublished: false })
      setShowNew(false)
      showToast('Post created ✓')
    } catch {
      showToast('Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleSavePost(post: BlogPostRow) {
    setSavingId(post.id)
    const edits = getEdit(post.id)
    const payload: Partial<BlogPostRow> = { ...edits }
    if (edits.isPublished === true && !post.publishedAt) {
      payload.publishedAt = new Date().toISOString()
    }
    try {
      const res = await fetch(`/api/cms/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchPosts()
      setEditingId(null)
      showToast('Post saved ✓')
    } catch {
      showToast('Save failed')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/cms/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await fetchPosts()
      showToast('Post deleted ✓')
    } catch {
      showToast('Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading posts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Toast message={toast} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Blog Posts · {posts.length} total
        </p>
        <button
          onClick={() => setShowNew(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          {showNew ? <X size={14} /> : <Plus size={14} />}
          {showNew ? 'Cancel' : 'Write New Post'}
        </button>
      </div>

      {showNew && (
        <Card>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>New Post</h3>
          <SettingsField label="Title" value={newPost.title} onChange={v => setNewPost(p => ({ ...p, title: v }))} placeholder="Post title..." />
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>Category</label>
            <select
              value={newPost.category}
              onChange={e => setNewPost(p => ({ ...p, category: e.target.value as BlogCategory }))}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <TextareaField label="Excerpt" value={newPost.excerpt} onChange={v => setNewPost(p => ({ ...p, excerpt: v }))} placeholder="Short summary..." />
          <TextareaField label="Content" value={newPost.content} onChange={v => setNewPost(p => ({ ...p, content: v }))} rows={8} placeholder="Full article content..." />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newPostPublish"
              checked={newPost.isPublished}
              onChange={e => setNewPost(p => ({ ...p, isPublished: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="newPostPublish" className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Publish immediately</label>
          </div>
          <button
            onClick={() => void handleCreate()}
            disabled={creating || !newPost.title.trim()}
            className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C', color: '#080809' }}
          >
            {creating ? 'Creating...' : 'Create Post'}
          </button>
        </Card>
      )}

      <div className="space-y-2">
        {posts.map(post => {
          const editing = editingId === post.id
          const edits = getEdit(post.id)
          const merged = { ...post, ...edits }
          return (
            <div
              key={post.id}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              {/* Row header */}
              <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{post.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                    {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                >
                  {post.category}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: post.isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
                    color: post.isPublished ? '#22c55e' : 'var(--color-text-dim)',
                  }}
                >
                  {post.isPublished ? 'Published' : 'Draft'}
                </span>
                <button
                  onClick={() => setEditingId(editing ? null : post.id)}
                  className="text-xs px-3 py-1.5 rounded-md font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)' }}
                >
                  {editing ? 'Close' : 'Edit'}
                </button>
                <button
                  onClick={() => void handleDelete(post.id)}
                  className="p-1.5 rounded transition-opacity hover:opacity-75"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Edit panel */}
              {editing && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <SettingsField label="Title" value={merged.title} onChange={v => setEdit(post.id, 'title', v)} />
                  <SettingsField label="Slug" value={merged.slug} onChange={v => setEdit(post.id, 'slug', v)} />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>Category</label>
                    <select
                      value={merged.category}
                      onChange={e => setEdit(post.id, 'category', e.target.value)}
                      className="w-full px-3 py-2 rounded-md text-sm outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    >
                      {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <TextareaField label="Excerpt" value={merged.excerpt} onChange={v => setEdit(post.id, 'excerpt', v)} />
                  <TextareaField label="Content" value={merged.content} onChange={v => setEdit(post.id, 'content', v)} rows={8} />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`publish-${post.id}`}
                      checked={merged.isPublished}
                      onChange={e => setEdit(post.id, 'isPublished', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`publish-${post.id}`} className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Published</label>
                  </div>
                  <div className="flex gap-2">
                    <SaveButton onClick={() => void handleSavePost(post)} saving={savingId === post.id} label="Save Post" />
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-md text-sm font-semibold"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TAB 6: TESTIMONIALS ─────────────────────────────────────────────────────

function TestimonialsTab() {
  const { toast, showToast } = useToast()
  const [items, setItems] = useState<TestimonialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', location: '', text: '', rating: 5, source: 'direct' })

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cms/testimonials')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as TestimonialRow[]
      setItems(data)
    } catch {
      showToast('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void fetchItems() }, [fetchItems])

  async function handleAdd() {
    if (!newItem.name.trim() || !newItem.text.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/cms/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchItems()
      setNewItem({ name: '', location: '', text: '', rating: 5, source: 'direct' })
      setShowAdd(false)
      showToast('Testimonial added ✓')
    } catch {
      showToast('Add failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleActive(item: TestimonialRow) {
    try {
      const res = await fetch(`/api/cms/testimonials/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error('Failed')
      setItems(prev => prev.map(t => t.id === item.id ? { ...t, isActive: !t.isActive } : t))
    } catch {
      showToast('Update failed')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/cms/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchItems()
      showToast('Testimonial removed ✓')
    } catch {
      showToast('Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading testimonials...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Toast message={toast} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Testimonials · {items.filter(i => i.isActive).length} active
        </p>
        <button
          onClick={() => setShowAdd(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Cancel' : 'Add Testimonial'}
        </button>
      </div>

      {showAdd && (
        <Card>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>New Testimonial</h3>
          <div className="grid grid-cols-2 gap-3">
            <SettingsField label="Name" value={newItem.name} onChange={v => setNewItem(p => ({ ...p, name: v }))} placeholder="Jane Smith" />
            <SettingsField label="Location" value={newItem.location} onChange={v => setNewItem(p => ({ ...p, location: v }))} placeholder="London" />
          </div>
          <TextareaField label="Testimonial Text" value={newItem.text} onChange={v => setNewItem(p => ({ ...p, text: v }))} placeholder="The process was seamless..." />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>Rating</label>
              <select
                value={newItem.rating}
                onChange={e => setNewItem(p => ({ ...p, rating: parseInt(e.target.value, 10) }))}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>Source</label>
              <select
                value={newItem.source}
                onChange={e => setNewItem(p => ({ ...p, source: e.target.value }))}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="direct">Direct</option>
                <option value="google">Google</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => void handleAdd()}
            disabled={adding || !newItem.name.trim() || !newItem.text.trim()}
            className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C', color: '#080809' }}
          >
            {adding ? 'Adding...' : 'Add Testimonial'}
          </button>
        </Card>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className="rounded-lg px-4 py-3 flex items-start gap-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${item.isActive ? 'var(--color-border)' : 'rgba(255,255,255,0.04)'}`,
              opacity: item.isActive ? 1 : 0.5,
            }}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: '#C9A84C' }}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {item.name}
                {item.location && (
                  <span className="font-normal ml-1.5 text-xs" style={{ color: 'var(--color-text-dim)' }}>· {item.location}</span>
                )}
              </p>
              <p className="text-xs italic leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                &ldquo;{item.text}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Toggle checked={item.isActive} onChange={() => void handleToggleActive(item)} disabled={false} />
              <button
                onClick={() => void handleDelete(item.id)}
                className="p-1.5 rounded transition-opacity hover:opacity-75"
                style={{ color: 'var(--color-text-dim)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 7: EVENTS ───────────────────────────────────────────────────────────

function EventsTab() {
  const [evts, setEvts] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast, showToast } = useToast()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as Event[]
      setEvts(Array.isArray(data) ? data : [])
    } catch {
      // empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchEvents() }, [fetchEvents])

  const handleToggle = async (event: Event) => {
    setSaving(event.id)
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnWebsite: !event.showOnWebsite }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setEvts(prev => prev.map(e => e.id === event.id ? { ...e, showOnWebsite: !e.showOnWebsite } : e))
      showToast('Website updated ✓')
    } catch {
      showToast('Update failed')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading events...</p>
      </div>
    )
  }

  return (
    <div>
      <Toast message={toast} />
      <div
        className="rounded-lg p-4 flex items-start gap-3 mb-6"
        style={{ border: '1px solid rgba(201,168,76,0.35)', backgroundColor: 'rgba(201,168,76,0.06)' }}
      >
        <CalendarDays size={16} style={{ color: '#C9A84C', marginTop: '2px', flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(232,228,220,0.75)' }}>
          Toggle events <strong style={{ color: '#C9A84C' }}>ON</strong> to show them on your public events page within 60 seconds.
        </p>
      </div>

      {evts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays size={32} style={{ color: 'var(--color-text-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>No events found. Add events in Events Manager first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="grid items-center gap-4 px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--color-text-dim)', fontSize: '10px', gridTemplateColumns: '1fr auto auto' }}
          >
            <span>Event</span>
            <span className="w-24 text-center">Type</span>
            <span className="w-28 text-center">Show on Website</span>
          </div>

          {evts.map(event => (
            <div
              key={event.id}
              className="grid items-center gap-4 px-4 py-3 rounded-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${event.showOnWebsite ? 'rgba(201,168,76,0.3)' : 'var(--color-border)'}`,
                gridTemplateColumns: '1fr auto auto',
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{event.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                  {new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.location ? ` · ${event.location}` : ''}
                </p>
              </div>

              <div className="w-24 text-center">
                <span
                  className="text-xs px-2 py-0.5 rounded capitalize"
                  style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                >
                  {event.eventType}
                </span>
              </div>

              <div className="w-28 flex flex-col items-center gap-1">
                <Toggle
                  checked={event.showOnWebsite}
                  onChange={() => void handleToggle(event)}
                  disabled={saving === event.id}
                />
                {saving === event.id && (
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB 8: SETTINGS ─────────────────────────────────────────────────────────

interface SettingsFields {
  // Contact
  contact_phone:    string
  contact_mobile:   string
  contact_email:    string
  contact_address1: string
  contact_address2: string
  contact_city:     string
  contact_postcode: string
  contact_hours:    string
  // Map
  map_lat:  string
  map_lng:  string
  map_zoom: string
  // Social
  social_facebook:  string
  social_instagram: string
  social_linkedin:  string
  social_youtube:   string
  // Off-market
  offmarket_password: string
  // Analytics
  analytics_google_id: string
  // Integrations
  maps_api_key:       string
  recaptcha_site_key: string
  mri_feed_url:       string
  eig_auction_url:    string
  // SEO
  seo_home_title:        string
  seo_home_description:  string
  seo_props_title:       string
  seo_props_description: string
  seo_sell_title:        string
  seo_sell_description:  string
  seo_finance_title:       string
  seo_finance_description: string
}

function SettingsTab() {
  const { toast, showToast } = useToast()

  const [fields, setFields] = useState<SettingsFields>({
    contact_phone:    '',
    contact_mobile:   '',
    contact_email:    '',
    contact_address1: '',
    contact_address2: '',
    contact_city:     '',
    contact_postcode: '',
    contact_hours:    '',
    map_lat:          '51.5074',
    map_lng:          '-0.1278',
    map_zoom:         '14',
    social_facebook:  'https://www.facebook.com/MidasPropertyGroupUK/',
    social_instagram: 'https://www.instagram.com/midas_property_auctions/',
    social_linkedin:  'https://www.linkedin.com/in/sam-fongho-a33963a/',
    social_youtube:   '',
    offmarket_password:   'MIDAS2026',
    analytics_google_id:  '',
    maps_api_key:         '',
    recaptcha_site_key:   '',
    mri_feed_url:         '',
    eig_auction_url:      '',
    seo_home_title:        '',
    seo_home_description:  '',
    seo_props_title:       '',
    seo_props_description: '',
    seo_sell_title:        '',
    seo_sell_description:  '',
    seo_finance_title:       '',
    seo_finance_description: '',
  })

  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  const set = (key: keyof SettingsFields) => (v: string) =>
    setFields(prev => ({ ...prev, [key]: v }))

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/public/config')
        if (!res.ok) return
        const data = await res.json() as { config: Record<string, string> }
        const c = data.config
        setFields(prev => ({
          ...prev,
          contact_phone:    c['contact.phone']    ?? prev.contact_phone,
          contact_mobile:   c['contact.mobile']   ?? prev.contact_mobile,
          contact_email:    c['contact.email']    ?? prev.contact_email,
          contact_address1: c['contact.address1'] ?? prev.contact_address1,
          contact_address2: c['contact.address2'] ?? prev.contact_address2,
          contact_city:     c['contact.city']     ?? prev.contact_city,
          contact_postcode: c['contact.postcode'] ?? prev.contact_postcode,
          contact_hours:    c['contact.hours']    ?? prev.contact_hours,
          map_lat:          c['map.lat']           ?? prev.map_lat,
          map_lng:          c['map.lng']           ?? prev.map_lng,
          map_zoom:         c['map.zoom']          ?? prev.map_zoom,
          social_facebook:  c['social.facebook']  ?? prev.social_facebook,
          social_instagram: c['social.instagram'] ?? prev.social_instagram,
          social_linkedin:  c['social.linkedin']  ?? prev.social_linkedin,
          social_youtube:   c['social.youtube']   ?? prev.social_youtube,
          offmarket_password:   c['offmarket.password']    ?? prev.offmarket_password,
          analytics_google_id:  c['analytics.google_id']  ?? prev.analytics_google_id,
          maps_api_key:         c['maps.api_key']          ?? prev.maps_api_key,
          recaptcha_site_key:   c['recaptcha.site_key']    ?? prev.recaptcha_site_key,
          mri_feed_url:         c['mri.feed_url']          ?? prev.mri_feed_url,
          eig_auction_url:      c['eig.auction_url']       ?? prev.eig_auction_url,
          seo_home_title:        c['seo.home.title']        ?? prev.seo_home_title,
          seo_home_description:  c['seo.home.description']  ?? prev.seo_home_description,
          seo_props_title:       c['seo.properties.title']       ?? prev.seo_props_title,
          seo_props_description: c['seo.properties.description'] ?? prev.seo_props_description,
          seo_sell_title:        c['seo.sell.title']        ?? prev.seo_sell_title,
          seo_sell_description:  c['seo.sell.description']  ?? prev.seo_sell_description,
          seo_finance_title:       c['seo.finance.title']       ?? prev.seo_finance_title,
          seo_finance_description: c['seo.finance.description'] ?? prev.seo_finance_description,
        }))
      } catch {
        // ignore
      }
    })()
  }, [])

  async function saveSection(sectionId: string, payload: Record<string, string>) {
    setSavingSection(sectionId)
    try {
      const res = await fetch('/api/public/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      setSavedSection(sectionId)
      showToast('Saved ✓')
      setTimeout(() => setSavedSection(null), 2000)
    } catch {
      showToast('Save failed')
    } finally {
      setSavingSection(null)
    }
  }

  const mapSrc = `https://maps.google.com/maps?q=${fields.map_lat},${fields.map_lng}&z=${fields.map_zoom}&output=embed`

  return (
    <div className="max-w-2xl space-y-5">
      <Toast message={toast} />

      {/* Section 1: Contact Details */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contact Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="Phone" value={fields.contact_phone} onChange={set('contact_phone')} placeholder="+44 20 0000 0000" />
          <SettingsField label="Mobile" value={fields.contact_mobile} onChange={set('contact_mobile')} placeholder="+44 7700 000000" />
        </div>
        <SettingsField label="Email" value={fields.contact_email} onChange={set('contact_email')} type="email" placeholder="info@midaspropertyauctions.com" />
        <SettingsField label="Address Line 1" value={fields.contact_address1} onChange={set('contact_address1')} placeholder="123 Example Street" />
        <SettingsField label="Address Line 2" value={fields.contact_address2} onChange={set('contact_address2')} placeholder="Suite 100" />
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="City" value={fields.contact_city} onChange={set('contact_city')} placeholder="London" />
          <SettingsField label="Postcode" value={fields.contact_postcode} onChange={set('contact_postcode')} placeholder="EC1A 1BB" />
        </div>
        <SettingsField label="Office Hours" value={fields.contact_hours} onChange={set('contact_hours')} placeholder="Mon–Fri 9am–6pm" />
        <SaveButton
          onClick={() => void saveSection('contact', {
            'contact.phone':    fields.contact_phone,
            'contact.mobile':   fields.contact_mobile,
            'contact.email':    fields.contact_email,
            'contact.address1': fields.contact_address1,
            'contact.address2': fields.contact_address2,
            'contact.city':     fields.contact_city,
            'contact.postcode': fields.contact_postcode,
            'contact.hours':    fields.contact_hours,
          })}
          saving={savingSection === 'contact'}
          saved={savedSection === 'contact'}
          label="Save Contact Details"
        />
      </Card>

      {/* Section 2: Map */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Map</h3>
        <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
          Right-click any location on Google Maps → &ldquo;What&apos;s here?&rdquo; → copy the numbers
        </p>
        <div className="grid grid-cols-3 gap-3">
          <SettingsField label="Latitude" value={fields.map_lat} onChange={set('map_lat')} placeholder="51.5074" />
          <SettingsField label="Longitude" value={fields.map_lng} onChange={set('map_lng')} placeholder="-0.1278" />
          <SettingsField label="Zoom Level" value={fields.map_zoom} onChange={set('map_zoom')} placeholder="14" />
        </div>
        <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-border)', height: '200px' }}>
          <iframe src={mapSrc} width="100%" height="200" style={{ border: 0 }} loading="lazy" title="Map preview" />
        </div>
        <SaveButton
          onClick={() => void saveSection('map', {
            'map.lat':  fields.map_lat,
            'map.lng':  fields.map_lng,
            'map.zoom': fields.map_zoom,
          })}
          saving={savingSection === 'map'}
          saved={savedSection === 'map'}
          label="Save Map"
        />
      </Card>

      {/* Section 3: Website Links (read-only shortcuts) */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Website Links</h3>
        <div className="flex flex-wrap gap-2">
          {WEBSITE_LINKS.map(([label, path]) => (
            <a
              key={label}
              href={path.startsWith('http') ? path : `${WEBSITE_URL}${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-75"
              style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
            >
              {label} <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </Card>

      {/* Section 4: Social Media */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Social Media</h3>
        <SettingsField label="Facebook URL"  value={fields.social_facebook}  onChange={set('social_facebook')}  placeholder="https://facebook.com/..." />
        <SettingsField label="Instagram URL" value={fields.social_instagram} onChange={set('social_instagram')} placeholder="https://instagram.com/..." />
        <SettingsField label="LinkedIn URL"  value={fields.social_linkedin}  onChange={set('social_linkedin')}  placeholder="https://linkedin.com/..." />
        <SettingsField label="YouTube URL"   value={fields.social_youtube}   onChange={set('social_youtube')}   placeholder="https://youtube.com/..." />
        <SaveButton
          onClick={() => void saveSection('social', {
            'social.facebook':  fields.social_facebook,
            'social.instagram': fields.social_instagram,
            'social.linkedin':  fields.social_linkedin,
            'social.youtube':   fields.social_youtube,
          })}
          saving={savingSection === 'social'}
          saved={savedSection === 'social'}
          label="Save Social Links"
        />
      </Card>

      {/* Section 5: Off-Market Access */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Off-Market Access</h3>
        <SettingsField
          label="Off-Market Password"
          value={fields.offmarket_password}
          onChange={set('offmarket_password')}
          placeholder="MIDAS2026"
        />
        <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
          Share this password only with pre-qualified investors.
        </p>
        <SaveButton
          onClick={() => void saveSection('offmarket', { 'offmarket.password': fields.offmarket_password })}
          saving={savingSection === 'offmarket'}
          saved={savedSection === 'offmarket'}
          label="Save Password"
        />
      </Card>

      {/* Section 6: Loan Application Link */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Loan Application Form</h3>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          Share this link with borrowers who want to apply for bridging finance.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value="https://os.midaspropertyauctions.co.uk/loans/apply"
            className="flex-1 px-3 py-2 rounded-md text-xs outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
          />
          <button
            onClick={() => void navigator.clipboard.writeText('https://os.midaspropertyauctions.co.uk/loans/apply')}
            className="px-3 py-2 rounded-md text-xs font-semibold"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
          >
            Copy
          </button>
        </div>
      </Card>

      {/* Section 7: Analytics */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Analytics</h3>
        <SettingsField
          label="Google Analytics ID"
          value={fields.analytics_google_id}
          onChange={set('analytics_google_id')}
          placeholder="G-XXXXXXXXXX"
        />
        <SaveButton
          onClick={() => void saveSection('analytics', { 'analytics.google_id': fields.analytics_google_id })}
          saving={savingSection === 'analytics'}
          saved={savedSection === 'analytics'}
          label="Save Analytics"
        />
      </Card>

      {/* Section 8: Integrations */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Integrations</h3>
        <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
          API keys are stored in the database and synced to the website. Keys from 2022 — regenerate in Google Cloud Console if needed.
        </p>
        <SettingsField
          label="Google Maps API Key"
          value={fields.maps_api_key}
          onChange={set('maps_api_key')}
          placeholder="AIzaSy..."
          helper="Used for the embedded map on the Contact page"
        />
        <SettingsField
          label="reCAPTCHA Site Key"
          value={fields.recaptcha_site_key}
          onChange={set('recaptcha_site_key')}
          placeholder="6Ld9..."
          helper="Protects the Contact and Register forms from spam"
        />
        <SettingsField
          label="MRI CRM Feed URL"
          value={fields.mri_feed_url}
          onChange={set('mri_feed_url')}
          placeholder="https://v4.salesandlettings.online/pls/midas/..."
          type="url"
          helper="Your MRI CRM XML property feed — auto-syncs to the Properties page every 5 minutes"
        />
        <SettingsField
          label="EIG Auction Platform URL"
          value={fields.eig_auction_url}
          onChange={set('eig_auction_url')}
          placeholder="https://www.eigroup.co.uk/..."
          type="url"
          helper="Link to your EIG bidding page — investors click here to bid on your properties"
        />
        <SaveButton
          onClick={() => void saveSection('integrations', {
            'maps.api_key':       fields.maps_api_key,
            'recaptcha.site_key': fields.recaptcha_site_key,
            'mri.feed_url':       fields.mri_feed_url,
            'eig.auction_url':    fields.eig_auction_url,
          })}
          saving={savingSection === 'integrations'}
          saved={savedSection === 'integrations'}
          label="Save Integrations"
        />
      </Card>

      {/* Section 9: SEO */}
      <Card>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>SEO — Page Titles & Descriptions</h3>
        <div className="space-y-4">
          {(
            [
              { page: 'Home',       titleKey: 'seo_home_title',        descKey: 'seo_home_description' },
              { page: 'Properties', titleKey: 'seo_props_title',       descKey: 'seo_props_description' },
              { page: 'Sell',       titleKey: 'seo_sell_title',        descKey: 'seo_sell_description' },
              { page: 'Finance',    titleKey: 'seo_finance_title',     descKey: 'seo_finance_description' },
            ] as Array<{ page: string; titleKey: keyof SettingsFields; descKey: keyof SettingsFields }>
          ).map(({ page, titleKey, descKey }) => (
            <div key={page} className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>{page}</p>
              <SettingsField label="Title" value={fields[titleKey]} onChange={set(titleKey)} placeholder={`${page} | Midas Property Auctions`} />
              <SettingsField label="Description" value={fields[descKey]} onChange={set(descKey)} placeholder="160 character description..." />
            </div>
          ))}
        </div>
        <SaveButton
          onClick={() => void saveSection('seo', {
            'seo.home.title':             fields.seo_home_title,
            'seo.home.description':       fields.seo_home_description,
            'seo.properties.title':       fields.seo_props_title,
            'seo.properties.description': fields.seo_props_description,
            'seo.sell.title':             fields.seo_sell_title,
            'seo.sell.description':       fields.seo_sell_description,
            'seo.finance.title':          fields.seo_finance_title,
            'seo.finance.description':    fields.seo_finance_description,
          })}
          saving={savingSection === 'seo'}
          saved={savedSection === 'seo'}
          label="Save SEO"
        />
      </Card>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState<Tab>('auction')

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#080809' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Globe size={22} style={{ color: '#C9A84C' }} />
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Website Admin</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>Everything changes in 30 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Live</span>
          </div>
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-75"
            style={{ border: '1px solid rgba(201,168,76,0.35)', color: '#C9A84C' }}
          >
            Preview Website <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto">
        <div
          className="flex gap-1 p-1 rounded-lg w-fit min-w-full sm:min-w-0"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: active ? '#C9A84C' : 'var(--color-text-dim)',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'auction'      && <AuctionTab />}
        {activeTab === 'lots'         && <LotsTab />}
        {activeTab === 'content'      && <ContentTab />}
        {activeTab === 'team'         && <TeamTab />}
        {activeTab === 'blog'         && <BlogTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'events'       && <EventsTab />}
        {activeTab === 'settings'     && <SettingsTab />}
      </div>

    </div>
  )
}
