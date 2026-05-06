'use client'

import { useEffect, useState } from 'react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import RichTextArea from '@/components/cms/RichTextArea'
import { useToast, Toast, SaveButton, Card, FieldInput, FieldTextarea, SectionLabel } from '../_shared'

type Page = 'Homepage' | 'About' | 'Sell' | 'Contact'

const PAGES: Page[] = ['Homepage', 'About', 'Sell', 'Contact']

interface SectionConfig {
  key: string
  label: string
  type: 'text' | 'textarea' | 'rich' | 'image' | 'url'
  placeholder?: string
  aiEnhance?: boolean
}

const PAGE_SECTIONS: Record<Page, SectionConfig[]> = {
  Homepage: [
    { key: 'home.hero_image', label: 'Hero Background Image', type: 'image' },
    { key: 'home.hero_h1_line1', label: 'Hero Headline Line 1', type: 'text', placeholder: 'e.g. London Property Auctions' },
    { key: 'home.hero_h1_line2', label: 'Hero Headline Line 2', type: 'text', placeholder: 'e.g. & Investment' },
    { key: 'home.hero_subtitle', label: 'Hero Subtitle', type: 'rich', aiEnhance: true },
    { key: 'home.cta1_text', label: 'CTA Button 1 Text', type: 'text', placeholder: 'e.g. View Properties' },
    { key: 'home.cta1_url', label: 'CTA Button 1 Link', type: 'url', placeholder: '/properties' },
    { key: 'home.cta2_text', label: 'CTA Button 2 Text', type: 'text', placeholder: 'e.g. Register as Investor' },
    { key: 'home.cta2_url', label: 'CTA Button 2 Link', type: 'url', placeholder: '/register' },
    { key: 'home.phone_display', label: 'Phone Display Text', type: 'text', placeholder: 'e.g. 0800 000 0000' },
    { key: 'home.contact_phone', label: 'Contact Bar: Phone', type: 'text' },
    { key: 'home.contact_mobile', label: 'Contact Bar: Mobile', type: 'text' },
    { key: 'home.contact_email', label: 'Contact Bar: Email', type: 'text' },
    { key: 'home.contact_hours', label: 'Contact Bar: Hours', type: 'text', placeholder: 'Mon–Fri 9am–6pm' },
    { key: 'home.welcome_heading', label: 'Welcome Section Heading', type: 'text' },
    { key: 'home.welcome_subtitle', label: 'Welcome Section Subtitle', type: 'rich', aiEnhance: true },
    { key: 'home.newsletter_heading', label: 'Newsletter Section Heading', type: 'text' },
    { key: 'home.newsletter_subtitle', label: 'Newsletter Section Subtitle', type: 'text' },
    { key: 'home.cta_banner_heading', label: 'CTA Banner Heading', type: 'text' },
    { key: 'home.cta_banner_sub', label: 'CTA Banner Sub-text', type: 'text' },
    { key: 'home.cta_banner_btn_text', label: 'CTA Banner Button Text', type: 'text' },
    { key: 'home.cta_banner_btn_url', label: 'CTA Banner Button Link', type: 'url' },
  ],
  About: [
    { key: 'about.company_story', label: 'Company Story', type: 'rich', aiEnhance: true },
    { key: 'about.how_we_do_it', label: '"How We Do It" Section', type: 'rich', aiEnhance: true },
    { key: 'about.mission_statement', label: 'Mission Statement', type: 'rich', aiEnhance: true },
  ],
  Sell: [
    { key: 'sell.hero_heading', label: 'Hero Heading', type: 'text' },
    { key: 'sell.hero_subtitle', label: 'Hero Subtitle', type: 'rich', aiEnhance: true },
    { key: 'sell.free_listing_message', label: 'Free Listing Message', type: 'textarea' },
  ],
  Contact: [
    { key: 'contact.address', label: 'Office Address', type: 'textarea', placeholder: '123 Street\nLondon\nEC1A 1BB' },
    { key: 'contact.phone', label: 'Phone', type: 'text' },
    { key: 'contact.email', label: 'Email', type: 'text' },
    { key: 'contact.hours', label: 'Office Hours', type: 'textarea' },
    { key: 'contact.map_lat', label: 'Map Latitude', type: 'text', placeholder: '51.5074' },
    { key: 'contact.map_lng', label: 'Map Longitude', type: 'text', placeholder: '-0.1278' },
  ],
}

export default function ContentTab() {
  const { toast, showToast } = useToast()
  const [activePage, setActivePage] = useState<Page>('Homepage')
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/public/config')
      .then(r => r.json())
      .then((data: unknown) => {
        if (typeof data === 'object' && data !== null) {
          const d = data as { config?: Record<string, string> }
          setValues(d.config ?? {})
        }
      })
      .catch(() => {})
  }, [])

  function set(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function saveSection(section: SectionConfig) {
    setSaving(section.key)
    try {
      await fetch('/api/cms/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: section.key, value: values[section.key] ?? '', label: `Updated ${section.label}` }),
      })
      showToast('Saved ✓')
    } catch { showToast('Save failed') }
    setSaving(null)
  }

  const sections = PAGE_SECTIONS[activePage]

  return (
    <div className="p-6">
      <Toast message={toast} />

      {/* Page selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PAGES.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setActivePage(p)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: activePage === p ? '#C9A84C' : 'rgba(255,255,255,0.05)',
              color: activePage === p ? '#080809' : 'var(--color-text-dim)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-w-2xl">
        {sections.map(section => (
          <Card key={section.key}>
            <div className="flex items-center justify-between">
              <SectionLabel>{section.label}</SectionLabel>
              <SaveButton
                onClick={() => void saveSection(section)}
                saving={saving === section.key}
                label="Save"
              />
            </div>

            {section.type === 'image' && (
              <ImageUploadField
                label=""
                value={values[section.key] ?? ''}
                onChange={v => set(section.key, v)}
              />
            )}
            {section.type === 'text' && (
              <input
                type="text"
                value={values[section.key] ?? ''}
                onChange={e => set(section.key, e.target.value)}
                placeholder={section.placeholder}
                className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            )}
            {section.type === 'url' && (
              <input
                type="text"
                value={values[section.key] ?? ''}
                onChange={e => set(section.key, e.target.value)}
                placeholder={section.placeholder ?? 'https://...'}
                className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            )}
            {section.type === 'textarea' && (
              <textarea
                value={values[section.key] ?? ''}
                onChange={e => set(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={3}
                className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            )}
            {section.type === 'rich' && (
              <RichTextArea
                label=""
                value={values[section.key] ?? ''}
                onChange={v => set(section.key, v)}
                fieldName={section.key}
                showAiEnhance={section.aiEnhance}
                rows={4}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
