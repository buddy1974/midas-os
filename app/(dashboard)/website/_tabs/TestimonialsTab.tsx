'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import RichTextArea from '@/components/cms/RichTextArea'
import {
  useToast, Toast, Toggle, SaveButton, Card, FieldInput,
  FieldTextarea, FieldSelect, SlidePanel, SectionLabel,
} from '../_shared'

interface Testimonial {
  id: string
  name: string
  location: string | null
  text: string
  rating: number
  isActive: boolean
  source: string | null
  sortOrder: number
  photoUrl: string | null
  googleReviewUrl: string | null
}

const SOURCE_OPTIONS = [
  { value: 'direct', label: 'Direct contact' },
  { value: 'google', label: 'Google Review' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Event attendee' },
]

function empty(): Partial<Testimonial> {
  return { name: '', location: '', text: '', rating: 5, isActive: true, source: 'direct', sortOrder: 0, photoUrl: '', googleReviewUrl: '' }
}

export default function TestimonialsTab() {
  const { toast, showToast } = useToast()
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partial<Testimonial> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [savingPlace, setSavingPlace] = useState(false)

  useEffect(() => {
    void load()
    void fetch('/api/public/config')
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { config?: Record<string, string> }
        setGooglePlaceId(data.config?.['google.place_id'] ?? '')
      })
      .catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/cms/testimonials')
      const data = await r.json() as Testimonial[]
      setItems(Array.isArray(data) ? data.sort((a, b) => a.sortOrder - b.sortOrder) : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function openNew() { setSelected(empty()); setIsNew(true) }
  function openEdit(t: Testimonial) { setSelected({ ...t }); setIsNew(false) }
  function closePanel() { setSelected(null) }
  function patch<K extends keyof Testimonial>(k: K, v: Testimonial[K]) {
    setSelected(prev => prev ? { ...prev, [k]: v } : prev)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      if (isNew) {
        await fetch('/api/cms/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
        })
      } else {
        await fetch(`/api/cms/testimonials/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
        })
      }
      showToast('Saved ✓')
      closePanel()
      void load()
    } catch { showToast('Save failed') }
    setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this testimonial?')) return
    await fetch(`/api/cms/testimonials/${id}`, { method: 'DELETE' })
    void load()
  }

  async function toggleActive(t: Testimonial) {
    await fetch(`/api/cms/testimonials/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    })
    void load()
  }

  async function savePlaceId() {
    setSavingPlace(true)
    try {
      await fetch('/api/cms/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'google.place_id', value: googlePlaceId, label: 'Updated Google Place ID' }),
      })
      showToast('Saved ✓')
    } catch { showToast('Save failed') }
    setSavingPlace(false)
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6">
      <Toast message={toast} />

      {/* Google Place ID */}
      <Card className="max-w-2xl mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⭐</div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Google Reviews Embed</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                Enter your Google Place ID to embed live Google Reviews on your website.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={googlePlaceId}
                onChange={e => setGooglePlaceId(e.target.value)}
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                className="flex-1 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <SaveButton onClick={() => void savePlaceId()} saving={savingPlace} label="Save" />
            </div>
            {googlePlaceId && (
              <p className="text-xs" style={{ color: '#22c55e' }}>● Google Reviews widget active</p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4 max-w-2xl">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Client Testimonials</h2>
        <button type="button" onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
          <Plus size={14} /> Add Testimonial
        </button>
      </div>

      {loading ? <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading…</p> : (
        <div className="space-y-2 max-w-2xl">
          {items.map(t => (
            <div key={t.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {t.photoUrl ? (
                <img src={t.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                  {initials(t.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{t.name}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10} fill={i < (t.rating ?? 5) ? '#C9A84C' : 'none'} style={{ color: '#C9A84C' }} />
                  ))}
                </div>
              </div>
              <Toggle checked={t.isActive} onChange={() => void toggleActive(t)} />
              <button type="button" onClick={() => openEdit(t)} className="p-1.5 hover:text-[#C9A84C]" style={{ color: 'var(--color-text-dim)' }}><Pencil size={14} /></button>
              <button type="button" onClick={() => void deleteItem(t.id)} className="p-1.5 hover:text-red-400" style={{ color: 'var(--color-text-dim)' }}><Trash2 size={14} /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>No testimonials yet.</p>}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={closePanel} title={isNew ? 'Add Testimonial' : 'Edit Testimonial'}>
        {selected && (
          <div className="space-y-4">
            <ImageUploadField label="Reviewer Photo (1:1)" value={selected.photoUrl ?? ''} onChange={v => patch('photoUrl', v)} aspectRatio="1:1" hint="Leave blank for initials" />
            <FieldInput label="Full Name" value={selected.name ?? ''} onChange={v => patch('name', v)} />
            <FieldInput label="Location / Title" value={selected.location ?? ''} onChange={v => patch('location', v)} placeholder="e.g. London Property Investor" />

            <div>
              <SectionLabel>Rating</SectionLabel>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => patch('rating', n)}>
                    <Star size={22} fill={(selected.rating ?? 5) >= n ? '#C9A84C' : 'none'} style={{ color: '#C9A84C' }} />
                  </button>
                ))}
              </div>
            </div>

            <RichTextArea label="Review Text" value={selected.text ?? ''} onChange={v => patch('text', v)} fieldName="testimonial" showAiEnhance rows={4} />
            <FieldSelect label="Source" value={selected.source ?? 'direct'} onChange={v => patch('source', v)} options={SOURCE_OPTIONS} />
            <FieldInput label="Google Review URL (optional)" value={selected.googleReviewUrl ?? ''} onChange={v => patch('googleReviewUrl', v)} type="url" helper="Links to the original review — shows 'Verified Google Review' badge" />

            <div className="flex items-center gap-3">
              <Toggle checked={!!(selected.isActive)} onChange={() => patch('isActive', !(selected.isActive))} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>Active (show on website)</span>
            </div>

            <div className="flex gap-3 pt-2">
              <SaveButton onClick={() => void save()} saving={saving} />
              <button type="button" onClick={closePanel} className="px-4 py-2 rounded-md text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>Cancel</button>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
