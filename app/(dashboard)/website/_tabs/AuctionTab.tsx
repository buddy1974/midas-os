'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useToast, Toast, SaveButton, Card, FieldInput, SectionLabel } from '../_shared'

type Fields = {
  auction_next_name: string
  auction_next_date: string
  auction_next_lots: string
  auction_catalogue_pdf: string
  auction_livestream_url: string
  offmarket_password: string
  stat_1_value: string
  stat_1_label: string
  stat_2_value: string
  stat_2_label: string
  stat_3_value: string
  stat_3_label: string
}

const KEY_MAP: Record<keyof Fields, string> = {
  auction_next_name:      'auction.next_name',
  auction_next_date:      'auction.next_date',
  auction_next_lots:      'auction.next_lots',
  auction_catalogue_pdf:  'auction.catalogue_pdf',
  auction_livestream_url: 'auction.livestream_url',
  offmarket_password:     'offmarket.password',
  stat_1_value:           'home.stat_1_value',
  stat_1_label:           'home.stat_1_label',
  stat_2_value:           'home.stat_2_value',
  stat_2_label:           'home.stat_2_label',
  stat_3_value:           'home.stat_3_value',
  stat_3_label:           'home.stat_3_label',
}

const DEFAULTS: Fields = {
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
}

export default function AuctionTab() {
  const { toast, showToast } = useToast()
  const [fields, setFields] = useState<Fields>(DEFAULTS)
  const [saving, setSaving] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const set = (key: keyof Fields) => (v: string) => setFields(prev => ({ ...prev, [key]: v }))

  useEffect(() => {
    void fetch('/api/public/config')
      .then(r => r.json())
      .then((data: unknown) => {
        if (typeof data !== 'object' || data === null) return
        const d = data as { config?: Record<string, string> }
        const c = d.config ?? {}
        setFields(prev => {
          const next = { ...prev }
          for (const [k, apiKey] of Object.entries(KEY_MAP)) {
            if (c[apiKey] !== undefined) {
              (next as Record<string, string>)[k] = c[apiKey]
            }
          }
          return next
        })
      })
      .catch(() => {})
  }, [])

  async function saveSection(sectionId: string, keys: (keyof Fields)[], label: string) {
    setSaving(sectionId)
    try {
      const body: Record<string, string> = {}
      for (const k of keys) body[KEY_MAP[k]] = fields[k]
      await fetch('/api/cms/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      await fetch('/api/cms/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: sectionId, value: JSON.stringify(body), label }),
      })
      showToast('Saved ✓')
    } catch {
      showToast('Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Toast message={toast} />

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Next Auction</h2>
        <FieldInput label="Auction Name" value={fields.auction_next_name} onChange={set('auction_next_name')} />
        <FieldInput label="Auction Date & Time" value={fields.auction_next_date} onChange={set('auction_next_date')} type="datetime-local" />
        <FieldInput label="Number of Lots" value={fields.auction_next_lots} onChange={set('auction_next_lots')} type="number" />
        <FieldInput label="Catalogue PDF URL" value={fields.auction_catalogue_pdf} onChange={set('auction_catalogue_pdf')} placeholder="https://..." />
        <FieldInput label="Livestream URL" value={fields.auction_livestream_url} onChange={set('auction_livestream_url')} placeholder="https://youtube.com/..." />
        <SaveButton
          onClick={() => void saveSection('auction_details', ['auction_next_name','auction_next_date','auction_next_lots','auction_catalogue_pdf','auction_livestream_url'], 'Updated auction details')}
          saving={saving === 'auction_details'}
        />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Homepage Stats</h2>
        {([1, 2, 3] as const).map(n => (
          <div key={n} className="grid grid-cols-2 gap-3">
            <FieldInput label={`Stat ${n} Value`} value={fields[`stat_${n}_value` as keyof Fields]} onChange={set(`stat_${n}_value` as keyof Fields)} />
            <FieldInput label={`Stat ${n} Label`} value={fields[`stat_${n}_label` as keyof Fields]} onChange={set(`stat_${n}_label` as keyof Fields)} />
          </div>
        ))}
        <SaveButton
          onClick={() => void saveSection('homepage_stats', ['stat_1_value','stat_1_label','stat_2_value','stat_2_label','stat_3_value','stat_3_label'], 'Updated homepage stats')}
          saving={saving === 'homepage_stats'}
        />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Off-Market Access</h2>
        <div className="space-y-1.5">
          <SectionLabel>Off-Market Password</SectionLabel>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={fields.offmarket_password}
              onChange={e => set('offmarket_password')(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="px-3 py-2 rounded-md" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <SaveButton
          onClick={() => void saveSection('offmarket_password', ['offmarket_password'], 'Updated off-market password')}
          saving={saving === 'offmarket_password'}
        />
      </Card>
    </div>
  )
}
