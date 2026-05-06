'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import VideoField from '@/components/cms/VideoField'
import RichEditor from '@/components/cms/RichEditor'
import VersionHistory from '@/components/cms/VersionHistory'
import {
  useToast, Toast, Toggle, SaveButton, Badge,
  FieldInput, FieldTextarea, FieldSelect, SlidePanel, PanelTabs,
} from '../_shared'

interface EventRow {
  id: string
  title: string
  description: string | null
  fullDescription: string | null
  eventType: string
  status: string
  location: string | null
  eventDate: string
  endTime: string | null
  maxCapacity: number | null
  currentRegistrations: number
  costType: string | null
  costAmount: number | null
  coverImage: string | null
  thumbnailUrl: string | null
  videoUrl: string | null
  recapVideoUrl: string | null
  registrationType: string
  formFields: string
  showInvestorOption: boolean
  customButtons: string | null
  isFeatured: boolean
  showOnWebsite: boolean
  confirmationMessage: string | null
  externalTicketUrl: string | null
  eventbriteUrl: string | null
}

type PanelTab = 'Details' | 'Media' | 'Registration' | 'History'

const EVENT_TYPES = [
  { value: 'webinar', label: 'Online Webinar' },
  { value: 'in_person', label: 'In-Person Networking' },
  { value: 'pre_auction', label: 'Pre-Auction Briefing' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' },
  { value: 'other', label: 'Other' },
]

const REG_TYPES = [
  { value: 'form', label: 'Inline Form' },
  { value: 'external', label: 'External Link' },
  { value: 'phone', label: 'Phone Only' },
  { value: 'none', label: 'No Registration' },
]

const FORM_FIELDS = [
  { value: 'full', label: 'Name + Email + Phone' },
  { value: 'name_email', label: 'Name + Email only' },
  { value: 'name_phone', label: 'Name + Phone only' },
  { value: 'name_only', label: 'Name only' },
]

function emptyEvent(): Partial<EventRow> {
  return {
    title: '', eventType: 'webinar', status: 'upcoming', location: '', description: '', fullDescription: '',
    eventDate: '', endTime: '', maxCapacity: undefined, currentRegistrations: 0,
    costType: 'free', costAmount: 0, coverImage: '', thumbnailUrl: '', videoUrl: '', recapVideoUrl: '',
    registrationType: 'form', formFields: 'full', showInvestorOption: false,
    customButtons: '[]', isFeatured: false, showOnWebsite: false,
    confirmationMessage: 'Thank you for registering. We will be in touch shortly.',
    externalTicketUrl: '', eventbriteUrl: '',
  }
}

function eventLabel(e: EventRow) {
  const date = new Date(e.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${date} · ${e.title}`
}

export default function EventsTab() {
  const { toast, showToast } = useToast()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partial<EventRow> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('Details')
  const [saving, setSaving] = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/events')
      const data = await r.json() as EventRow[]
      setEvents(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function openNew() { setSelected(emptyEvent()); setIsNew(true); setPanelTab('Details') }
  function openEdit(e: EventRow) { setSelected({ ...e }); setIsNew(false); setPanelTab('Details') }
  function closePanel() { setSelected(null) }
  function patch<K extends keyof EventRow>(k: K, v: EventRow[K]) {
    setSelected(prev => prev ? { ...prev, [k]: v } : prev)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      if (isNew) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
        })
      } else {
        await fetch(`/api/events/${selected.id}`, {
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

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    void load()
  }

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.eventDate) >= now)
  const past = events.filter(e => new Date(e.eventDate) < now)

  const customButtons: { label: string; url: string }[] = (() => {
    try { return JSON.parse(selected?.customButtons ?? '[]') as { label: string; url: string }[] }
    catch { return [] }
  })()

  function setCustomButtons(arr: { label: string; url: string }[]) {
    patch('customButtons', JSON.stringify(arr))
  }

  return (
    <div className="p-6">
      <Toast message={toast} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Events ({events.length})</h2>
        <button type="button" onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
          <Plus size={14} /> Create New Event
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading…</p>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {[{ label: 'Upcoming', list: upcoming }, { label: 'Past', list: past }].map(({ label, list }) => list.length > 0 && (
            <div key={label}>
              <p className="text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>{label}</p>
              <div className="space-y-2">
                {list.map(e => (
                  <div key={e.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{eventLabel(e)}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{e.eventType.replace('_', ' ')} · {e.currentRegistrations} registered</p>
                    </div>
                    <Badge color={e.showOnWebsite ? '#22c55e' : '#6b7280'}>{e.showOnWebsite ? 'Live' : 'Hidden'}</Badge>
                    <button type="button" onClick={() => openEdit(e)} className="p-1.5 hover:text-[#C9A84C]" style={{ color: 'var(--color-text-dim)' }}><Pencil size={14} /></button>
                    <button type="button" onClick={() => void deleteEvent(e.id)} className="p-1.5 hover:text-red-400" style={{ color: 'var(--color-text-dim)' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>No events yet.</p>}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={closePanel} title={isNew ? 'Create Event' : 'Edit Event'} width={560}>
        {selected && (
          <>
            <PanelTabs tabs={['Details', 'Media', 'Registration', 'History']} active={panelTab} onChange={t => setPanelTab(t as PanelTab)} />

            {panelTab === 'Details' && (
              <div className="space-y-4">
                <FieldInput label="Event Name" value={selected.title ?? ''} onChange={v => patch('title', v)} />
                <FieldSelect label="Event Type" value={selected.eventType ?? 'webinar'} onChange={v => patch('eventType', v)} options={EVENT_TYPES} />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Date" value={selected.eventDate?.slice(0, 16) ?? ''} onChange={v => patch('eventDate', v)} type="datetime-local" />
                  <FieldInput label="End Time" value={selected.endTime?.slice(0, 16) ?? ''} onChange={v => patch('endTime', v || null)} type="datetime-local" />
                </div>
                <FieldInput label="Location / Platform" value={selected.location ?? ''} onChange={v => patch('location', v)} placeholder="Zoom — link sent on registration" />
                <FieldTextarea label="Short Description" value={selected.description ?? ''} onChange={v => patch('description', v)} rows={2} placeholder="Used as preview text" />
                <div>
                  <p className="text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--color-text-dim)' }}>Full Description</p>
                  <RichEditor value={selected.fullDescription ?? ''} onChange={v => patch('fullDescription', v)} minHeight={150} fieldName="event_description" showAiEnhance placeholder="Write a compelling event description…" />
                </div>

                <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>Cost</p>
                  <div className="flex gap-3">
                    {['free', 'paid'].map(ct => (
                      <button key={ct} type="button" onClick={() => patch('costType', ct)} className="flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors" style={{ backgroundColor: selected.costType === ct ? 'rgba(201,168,76,0.15)' : 'transparent', color: selected.costType === ct ? '#C9A84C' : 'var(--color-text-dim)', border: `1px solid ${selected.costType === ct ? 'rgba(201,168,76,0.4)' : 'var(--color-border)'}` }}>
                        {ct}
                      </button>
                    ))}
                  </div>
                  {selected.costType === 'paid' && (
                    <FieldInput label="Amount (£)" value={String((selected.costAmount ?? 0) / 100)} onChange={v => patch('costAmount', Math.round(parseFloat(v || '0') * 100))} type="number" placeholder="0.00" />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Toggle checked={!!(selected.isFeatured)} onChange={() => patch('isFeatured', !(selected.isFeatured))} />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>Featured (show on homepage)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={!!(selected.showOnWebsite)} onChange={() => patch('showOnWebsite', !(selected.showOnWebsite))} />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>Show on Website</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>Custom Buttons (up to 3)</p>
                  {customButtons.map((btn, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={btn.label} onChange={e => { const a = [...customButtons]; a[i] = { ...a[i], label: e.target.value }; setCustomButtons(a) }} placeholder="Button label" className="flex-1 px-2 py-1.5 rounded text-xs outline-none focus:ring-1 focus:ring-[#C9A84C]" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                      <input value={btn.url} onChange={e => { const a = [...customButtons]; a[i] = { ...a[i], url: e.target.value }; setCustomButtons(a) }} placeholder="https://..." className="flex-1 px-2 py-1.5 rounded text-xs outline-none focus:ring-1 focus:ring-[#C9A84C]" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                      <button type="button" onClick={() => setCustomButtons(customButtons.filter((_, j) => j !== i))} className="text-red-400 px-2">×</button>
                    </div>
                  ))}
                  {customButtons.length < 3 && (
                    <button type="button" onClick={() => setCustomButtons([...customButtons, { label: '', url: '' }])} className="text-xs" style={{ color: '#C9A84C' }}>+ Add Button</button>
                  )}
                </div>
              </div>
            )}

            {panelTab === 'Media' && (
              <div className="space-y-5">
                <ImageUploadField label="Cover Image (16:9)" value={selected.coverImage ?? ''} onChange={v => patch('coverImage', v)} aspectRatio="16:9" hint="Shown on events page and homepage" />
                <VideoField label="Event Video" value={selected.videoUrl ?? ''} onChange={v => patch('videoUrl', v)} hint="Livestream link, recording or promo video" />
                <VideoField label="Recap Video" value={selected.recapVideoUrl ?? ''} onChange={v => patch('recapVideoUrl', v)} hint="Add recording after the event" />
              </div>
            )}

            {panelTab === 'Registration' && (
              <div className="space-y-4">
                <FieldSelect label="Registration Type" value={selected.registrationType ?? 'form'} onChange={v => patch('registrationType', v)} options={REG_TYPES} />

                {selected.registrationType === 'form' && (
                  <>
                    <FieldSelect label="Form Fields" value={selected.formFields ?? 'full'} onChange={v => patch('formFields', v)} options={FORM_FIELDS} />
                    <div className="flex items-center gap-3">
                      <Toggle checked={!!(selected.showInvestorOption)} onChange={() => patch('showInvestorOption', !(selected.showInvestorOption))} />
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>Show &ldquo;Register as Midas investor&rdquo; option</span>
                    </div>
                    <FieldInput label="Max Capacity (optional)" value={String(selected.maxCapacity ?? '')} onChange={v => patch('maxCapacity', v ? parseInt(v) : null)} type="number" helper="Shows 'X spots left' when near capacity" />
                    <FieldTextarea label="Confirmation Message" value={selected.confirmationMessage ?? ''} onChange={v => patch('confirmationMessage', v)} rows={2} placeholder="Thank you for registering…" />
                  </>
                )}

                {selected.registrationType === 'external' && (
                  <>
                    <FieldInput label="Button Label" value={selected.title ? 'Register on Eventbrite' : ''} onChange={() => {}} placeholder="Register on Eventbrite" />
                    <FieldInput label="External Ticket URL" value={selected.externalTicketUrl ?? ''} onChange={v => patch('externalTicketUrl', v)} type="url" placeholder="https://eventbrite.com/..." />
                    <FieldInput label="Eventbrite URL" value={selected.eventbriteUrl ?? ''} onChange={v => patch('eventbriteUrl', v)} type="url" placeholder="https://eventbrite.co.uk/..." />
                  </>
                )}

                {selected.registrationType === 'phone' && (
                  <FieldInput label="Phone Number to Display" value={selected.location ?? ''} onChange={v => patch('location', v)} type="tel" />
                )}
              </div>
            )}

            {panelTab === 'History' && selected.id && (
              <VersionHistory contentType="event" contentId={selected.id} onRestore={prev => {
                try { setSelected(s => ({ ...s, ...JSON.parse(prev) as Partial<EventRow> })); showToast('Restored ✓') }
                catch { showToast('Could not restore') }
              }} />
            )}

            {panelTab !== 'History' && (
              <div className="flex gap-3 pt-2">
                <SaveButton onClick={() => void save()} saving={saving} />
                <button type="button" onClick={closePanel} className="px-4 py-2 rounded-md text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>Cancel</button>
              </div>
            )}
          </>
        )}
      </SlidePanel>
    </div>
  )
}
