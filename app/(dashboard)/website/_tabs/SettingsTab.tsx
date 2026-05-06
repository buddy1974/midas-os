'use client'

import { useEffect, useState } from 'react'
import { useToast, Toast, SaveButton, Card, FieldInput, SectionLabel } from '../_shared'

export default function SettingsTab() {
  const { toast, showToast } = useToast()
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/public/config')
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { config?: Record<string, string> }
        setConfig(data.config ?? {})
      })
      .catch(() => {})
  }, [])

  function set(key: string, val: string) {
    setConfig(prev => ({ ...prev, [key]: val }))
  }

  async function saveKeys(sectionId: string, keys: string[], label: string) {
    setSaving(sectionId)
    try {
      const body: Record<string, string> = {}
      for (const k of keys) body[k] = config[k] ?? ''
      await fetch('/api/cms/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast('Saved ✓')
    } catch { showToast('Save failed') }
    setSaving(null)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Toast message={toast} />

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Contact Details</h2>
        <FieldInput label="Phone" value={config['contact.phone'] ?? ''} onChange={v => set('contact.phone', v)} />
        <FieldInput label="Mobile" value={config['contact.mobile'] ?? ''} onChange={v => set('contact.mobile', v)} />
        <FieldInput label="Email" value={config['contact.email'] ?? ''} onChange={v => set('contact.email', v)} type="email" />
        <FieldInput label="Office Address" value={config['contact.address'] ?? ''} onChange={v => set('contact.address', v)} />
        <SaveButton onClick={() => void saveKeys('contact', ['contact.phone','contact.mobile','contact.email','contact.address'], 'Updated contact details')} saving={saving === 'contact'} />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Social Media</h2>
        <FieldInput label="Facebook URL" value={config['social.facebook'] ?? ''} onChange={v => set('social.facebook', v)} type="url" />
        <FieldInput label="Instagram URL" value={config['social.instagram'] ?? ''} onChange={v => set('social.instagram', v)} type="url" />
        <FieldInput label="LinkedIn URL" value={config['social.linkedin'] ?? ''} onChange={v => set('social.linkedin', v)} type="url" />
        <FieldInput label="YouTube URL" value={config['social.youtube'] ?? ''} onChange={v => set('social.youtube', v)} type="url" />
        <SaveButton onClick={() => void saveKeys('social', ['social.facebook','social.instagram','social.linkedin','social.youtube'], 'Updated social media links')} saving={saving === 'social'} />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Google Reviews</h2>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          Used by the Testimonials tab to embed live Google Reviews on your website.
        </p>
        <FieldInput
          label="Google Place ID"
          value={config['google.place_id'] ?? ''}
          onChange={v => set('google.place_id', v)}
          placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
          helper="Find yours at developers.google.com/maps/docs/places"
        />
        <SaveButton onClick={() => void saveKeys('google', ['google.place_id'], 'Updated Google Place ID')} saving={saving === 'google'} />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Website Meta</h2>
        <FieldInput label="Site Title" value={config['meta.title'] ?? ''} onChange={v => set('meta.title', v)} placeholder="Midas Property Auctions" />
        <FieldInput label="Site Description" value={config['meta.description'] ?? ''} onChange={v => set('meta.description', v)} placeholder="London property auction specialists…" />
        <SaveButton onClick={() => void saveKeys('meta', ['meta.title','meta.description'], 'Updated website meta')} saving={saving === 'meta'} />
      </Card>

      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Off-Market & Security</h2>
        <SectionLabel>Off-Market Section Password</SectionLabel>
        <FieldInput
          label=""
          value={config['offmarket.password'] ?? ''}
          onChange={v => set('offmarket.password', v)}
          type="password"
          placeholder="••••••••"
        />
        <SaveButton onClick={() => void saveKeys('security', ['offmarket.password'], 'Updated off-market password')} saving={saving === 'security'} />
      </Card>
    </div>
  )
}
