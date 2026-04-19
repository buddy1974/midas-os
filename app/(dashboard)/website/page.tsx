'use client'

import { useEffect, useState, useCallback } from 'react'
import { Globe, Settings, CalendarDays, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'

const WEBSITE_URL = 'https://midas-website-rho.vercel.app'

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

type Tab = 'lots' | 'events' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'lots', label: 'Lots', icon: Globe },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pence)
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

function LotsTab() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

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
      // leave state unchanged
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
      <InfoBanner />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-xl"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          {toast}
        </div>
      )}

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
            const savingMarket = saving === `${lot.id}:isOffMarket`
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
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {lot.address}
                  </p>
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
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
                  )}
                </div>

                <div className="w-24 flex flex-col items-center gap-1">
                  <Toggle
                    checked={lot.isOffMarket}
                    onChange={() => void handleToggle(lot, 'isOffMarket')}
                    disabled={savingMarket}
                  />
                  {savingMarket && (
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
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

function EventsTab() {
  const [evts, setEvts] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

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
      // leave state unchanged
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
      <div
        className="rounded-lg p-4 flex items-start gap-3 mb-6"
        style={{ border: '1px solid rgba(201,168,76,0.35)', backgroundColor: 'rgba(201,168,76,0.06)' }}
      >
        <CalendarDays size={16} style={{ color: '#C9A84C', marginTop: '2px', flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(232,228,220,0.75)' }}>
          Toggle events <strong style={{ color: '#C9A84C' }}>ON</strong> to show them on your public events page within 60 seconds.
        </p>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-xl"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          {toast}
        </div>
      )}

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
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {event.title}
                </p>
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
                  <span className="text-xs" style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>Saving...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)', fontSize: '10px' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      />
    </div>
  )
}

const WEBSITE_LINKS = [
  ['Homepage', '/'],
  ['Properties', '/properties'],
  ['Off-Market', '/off-market'],
  ['Finance', '/finance'],
  ['Events', '/events'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Register', '/register'],
  ['Compare', '/compare'],
  ['Loan Application', 'https://midas-property-sam.vercel.app/loans/apply'],
]

function SettingsTab() {
  const [password, setPassword] = useState('MIDAS2026')
  const [facebook, setFacebook] = useState('https://www.facebook.com/MidasPropertyGroupUK/')
  const [instagram, setInstagram] = useState('https://www.instagram.com/midas_property_auctions/')
  const [linkedin, setLinkedin] = useState('https://www.linkedin.com/in/sam-fongho-a33963a/')
  const [gaId, setGaId] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPassword(localStorage.getItem('website_off_market_password') ?? 'MIDAS2026')
    setFacebook(localStorage.getItem('website_facebook') ?? 'https://www.facebook.com/MidasPropertyGroupUK/')
    setInstagram(localStorage.getItem('website_instagram') ?? 'https://www.instagram.com/midas_property_auctions/')
    setLinkedin(localStorage.getItem('website_linkedin') ?? 'https://www.linkedin.com/in/sam-fongho-a33963a/')
    setGaId(localStorage.getItem('website_ga_id') ?? '')
  }, [])

  function handleSave() {
    localStorage.setItem('website_off_market_password', password)
    localStorage.setItem('website_facebook', facebook)
    localStorage.setItem('website_instagram', instagram)
    localStorage.setItem('website_linkedin', linkedin)
    localStorage.setItem('website_ga_id', gaId)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-6">
      <section
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Off-Market Access</h3>
        <SettingsField label="Off-Market Password" value={password} onChange={setPassword} type="text" placeholder="MIDAS2026" />
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          Share this password only with pre-qualified investors.
        </p>
      </section>

      <section
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
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
      </section>

      <section
        className="rounded-lg p-5 space-y-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Loan Application Form</h3>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          Share this link with borrowers who want to apply for bridging finance.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value="https://midas-property-sam.vercel.app/loans/apply"
            className="flex-1 px-3 py-2 rounded-md text-xs outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
          />
          <button
            onClick={() => navigator.clipboard.writeText('https://midas-property-sam.vercel.app/loans/apply')}
            className="px-3 py-2 rounded-md text-xs font-semibold"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
          >
            Copy
          </button>
        </div>
      </section>

      <section
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Social Media</h3>
        <SettingsField label="Facebook URL" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." />
        <SettingsField label="Instagram URL" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
        <SettingsField label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/company/..." />
      </section>

      <section
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Analytics</h3>
        <SettingsField label="Google Analytics ID" value={gaId} onChange={setGaId} placeholder="G-XXXXXXXXXX" />
      </section>

      <button
        onClick={handleSave}
        className="px-5 py-2 rounded-md text-sm font-semibold transition-opacity"
        style={{ backgroundColor: '#C9A84C', color: '#080809' }}
      >
        {saved ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  )
}

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState<Tab>('lots')

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#080809' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe size={22} style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Website Admin
          </h1>
        </div>
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
          style={{ color: '#C9A84C' }}
        >
          View live website <ExternalLink size={12} />
        </a>
      </div>

      <div
        className="flex gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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

      <div>
        {activeTab === 'lots' && <LotsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
