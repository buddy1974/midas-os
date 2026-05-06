'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import VideoField from '@/components/cms/VideoField'
import RichTextArea from '@/components/cms/RichTextArea'
import VersionHistory from '@/components/cms/VersionHistory'
import {
  useToast, Toast, Toggle, SaveButton, Card, FieldInput, FieldTextarea,
  FieldSelect, SlidePanel, PanelTabs, Badge, formatPrice,
} from '../_shared'

interface LotRow {
  id: string
  address: string
  area: string | null
  guidePrice: number
  pipelineStage: string
  showOnWebsite: boolean
  isOffMarket: boolean
  isFeatured: boolean
  addressVisible: boolean
  coverImage: string | null
  videoUrl: string | null
  virtualTourUrl: string | null
  addressLine1: string | null
  addressLine2: string | null
  description: string | null
  keyFeatures: string | null
  propertyType: string | null
  bedrooms: number | null
  bathrooms: number | null
  floorArea: string | null
  tenure: string | null
  arv: number | null
  auctionDate: string | null
  images: string | null
  floorPlanUrl: string | null
  legalPackUrl: string | null
  vendorName: string | null
  vendorEmail: string | null
}

type PanelTab = 'Details' | 'Media' | 'Visibility' | 'History'

const STAGE_OPTIONS = [
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'legal_pack', label: 'Legal Pack' },
  { value: 'going_to_auction', label: 'Going to Auction' },
  { value: 'sold', label: 'Sold' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const TYPE_OPTIONS = [
  { value: '', label: '— Select type —' },
  { value: 'Residential', label: 'Residential' },
  { value: 'HMO', label: 'HMO' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Development', label: 'Development' },
  { value: 'Land', label: 'Land' },
  { value: 'Mixed Use', label: 'Mixed Use' },
]

const TENURE_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'Freehold', label: 'Freehold' },
  { value: 'Leasehold', label: 'Leasehold' },
  { value: 'Share of Freehold', label: 'Share of Freehold' },
]

function stageBadgeColor(stage: string) {
  const map: Record<string, string> = {
    sourcing: '#6b7280', legal_pack: '#a78bfa', going_to_auction: '#C9A84C',
    sold: '#22c55e', completed: '#16a34a', withdrawn: '#ef4444',
  }
  return map[stage] ?? '#6b7280'
}

function emptyLot(): Partial<LotRow> {
  return {
    address: '', area: '', guidePrice: 0, pipelineStage: 'sourcing',
    showOnWebsite: false, isOffMarket: false, isFeatured: false,
    addressVisible: true, coverImage: '', videoUrl: '', virtualTourUrl: '',
    addressLine1: '', addressLine2: '', description: '', keyFeatures: '[]',
    propertyType: '', bedrooms: undefined, bathrooms: undefined,
    floorArea: '', tenure: '', arv: undefined, images: '[]',
    floorPlanUrl: '', legalPackUrl: '', vendorName: '', vendorEmail: '',
  }
}

export default function PropertiesTab() {
  const { toast, showToast } = useToast()
  const [lots, setLots] = useState<LotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partial<LotRow> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('Details')
  const [saving, setSaving] = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/lots')
      const data = await r.json() as LotRow[]
      setLots(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function openNew() {
    setSelected(emptyLot())
    setIsNew(true)
    setPanelTab('Details')
  }

  function openEdit(lot: LotRow) {
    setSelected({ ...lot })
    setIsNew(false)
    setPanelTab('Details')
  }

  function closePanel() { setSelected(null) }

  function patch<K extends keyof LotRow>(key: K, val: LotRow[K]) {
    setSelected(prev => prev ? { ...prev, [key]: val } : prev)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const body = { ...selected }
      if (isNew) {
        if (!body.address) body.address = body.area ?? 'Unnamed Property'
        await fetch('/api/lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch(`/api/lots/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      showToast('Saved ✓')
      closePanel()
      void load()
    } catch { showToast('Save failed') }
    setSaving(false)
  }

  async function toggleWebsite(lot: LotRow) {
    await fetch(`/api/lots/${lot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showOnWebsite: !lot.showOnWebsite }),
    })
    void load()
  }

  async function deleteLot(id: string) {
    if (!confirm('Remove this property?')) return
    await fetch(`/api/lots/${id}`, { method: 'DELETE' })
    void load()
  }

  const features: string[] = (() => {
    try { return JSON.parse(selected?.keyFeatures ?? '[]') as string[] }
    catch { return [] }
  })()

  function setFeatures(arr: string[]) {
    patch('keyFeatures', JSON.stringify(arr))
  }

  return (
    <div className="p-6">
      <Toast message={toast} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
          Available Properties ({lots.length})
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          <Plus size={14} /> Add Property
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {lots.map(lot => (
            <div
              key={lot.id}
              className="rounded-lg p-4 flex items-center gap-4"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              {lot.coverImage ? (
                <img src={lot.coverImage} alt="" className="w-14 h-10 object-cover rounded shrink-0" />
              ) : (
                <div className="w-14 h-10 rounded shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>🏠</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {lot.addressVisible ? (lot.addressLine1 || lot.address) : 'Address: Private'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  {lot.area ?? ''} · {formatPrice(lot.guidePrice)}
                </p>
              </div>
              <Badge color={stageBadgeColor(lot.pipelineStage)}>{lot.pipelineStage.replace('_', ' ')}</Badge>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                <span>Web</span>
                <Toggle checked={lot.showOnWebsite} onChange={() => void toggleWebsite(lot)} />
              </div>
              <button type="button" onClick={() => openEdit(lot)} className="p-1.5 rounded hover:text-[#C9A84C]" style={{ color: 'var(--color-text-dim)' }}>
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => void deleteLot(lot.id)} className="p-1.5 rounded hover:text-red-400" style={{ color: 'var(--color-text-dim)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {lots.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>No properties yet — click Add Property to get started.</p>
          )}
        </div>
      )}

      {/* Edit panel */}
      <SlidePanel
        open={!!selected}
        onClose={closePanel}
        title={isNew ? 'Add Property' : 'Edit Property'}
        subtitle="Changes go live on the website within 30 seconds"
      >
        {selected && (
          <>
            <PanelTabs tabs={['Details', 'Media', 'Visibility', 'History']} active={panelTab} onChange={t => setPanelTab(t as PanelTab)} />

            {panelTab === 'Details' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>Address</p>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={selected.addressVisible ?? true}
                      onChange={() => patch('addressVisible', !(selected.addressVisible ?? true))}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Show address publicly</span>
                  </div>
                  {selected.addressVisible && (
                    <>
                      <FieldInput label="Address Line 1" value={selected.addressLine1 ?? ''} onChange={v => patch('addressLine1', v)} />
                      <FieldInput label="Address Line 2" value={selected.addressLine2 ?? ''} onChange={v => patch('addressLine2', v)} />
                    </>
                  )}
                  <FieldInput
                    label="Area / Location (always public)"
                    value={selected.area ?? ''}
                    onChange={v => patch('area', v)}
                    placeholder="e.g. Harrow, North London"
                    helper="Shown publicly — be as specific or vague as you like"
                  />
                  {!selected.addressVisible && (
                    <p className="text-xs px-3 py-2 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                      Address will show as &ldquo;Address provided to serious enquirers only&rdquo;
                    </p>
                  )}
                </div>

                <FieldSelect label="Property Type" value={selected.propertyType ?? ''} onChange={v => patch('propertyType', v)} options={TYPE_OPTIONS} />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Bedrooms" value={String(selected.bedrooms ?? '')} onChange={v => patch('bedrooms', v ? parseInt(v) : null)} type="number" />
                  <FieldInput label="Bathrooms" value={String(selected.bathrooms ?? '')} onChange={v => patch('bathrooms', v ? parseInt(v) : null)} type="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Floor Area" value={selected.floorArea ?? ''} onChange={v => patch('floorArea', v)} placeholder="e.g. 1,200 sq ft" />
                  <FieldSelect label="Tenure" value={selected.tenure ?? ''} onChange={v => patch('tenure', v)} options={TENURE_OPTIONS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Guide Price (£)" value={String(selected.guidePrice ?? 0)} onChange={v => patch('guidePrice', parseInt(v) || 0)} type="number" />
                  <FieldInput label="ARV (£, optional)" value={String(selected.arv ?? '')} onChange={v => patch('arv', v ? parseInt(v) : null)} type="number" />
                </div>
                <FieldInput label="Auction Date (optional)" value={selected.auctionDate ?? ''} onChange={v => patch('auctionDate', v || null)} type="datetime-local" />

                <RichTextArea
                  label="Description"
                  value={selected.description ?? ''}
                  onChange={v => patch('description', v)}
                  fieldName="property_description"
                  showAiEnhance
                  rows={5}
                  placeholder="Paste property details or key facts — click AI Enhance to generate professional listing copy"
                />

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>Key Features (max 8)</p>
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={e => { const a = [...features]; a[i] = e.target.value; setFeatures(a) }}
                        className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      />
                      <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-red-400 px-2">×</button>
                    </div>
                  ))}
                  {features.length < 8 && (
                    <button type="button" onClick={() => setFeatures([...features, ''])} className="text-xs" style={{ color: '#C9A84C' }}>
                      + Add feature
                    </button>
                  )}
                </div>

                <FieldSelect label="Stage" value={selected.pipelineStage ?? 'sourcing'} onChange={v => patch('pipelineStage', v)} options={STAGE_OPTIONS} />
              </div>
            )}

            {panelTab === 'Media' && (
              <div className="space-y-5">
                <ImageUploadField label="Main Image (16:9)" value={selected.coverImage ?? ''} onChange={v => patch('coverImage', v)} aspectRatio="16:9" />
                <VideoField label="Video Tour" value={selected.videoUrl ?? ''} onChange={v => patch('videoUrl', v)} hint="YouTube, Vimeo, or upload" />
                <FieldInput label="Virtual Tour URL" value={selected.virtualTourUrl ?? ''} onChange={v => patch('virtualTourUrl', v)} placeholder="Matterport or virtual tour link" />
                <ImageUploadField label="Floor Plan" value={selected.floorPlanUrl ?? ''} onChange={v => patch('floorPlanUrl', v)} />
                <FieldInput label="Legal Pack PDF URL" value={selected.legalPackUrl ?? ''} onChange={v => patch('legalPackUrl', v)} placeholder="https://..." helper="Downloadable legal pack for investors" />
              </div>
            )}

            {panelTab === 'Visibility' && (
              <div className="space-y-4">
                {([
                  { key: 'showOnWebsite', label: 'Show on Website' },
                  { key: 'isOffMarket', label: 'Off-Market' },
                  { key: 'isFeatured', label: 'Featured (Homepage)' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Toggle checked={!!(selected[key])} onChange={() => patch(key, !(selected[key]))} />
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
                  </div>
                ))}
                <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>Vendor Details</p>
                  <FieldInput label="Vendor Name" value={selected.vendorName ?? ''} onChange={v => patch('vendorName', v)} />
                  <FieldInput label="Vendor Email" value={selected.vendorEmail ?? ''} onChange={v => patch('vendorEmail', v)} type="email" />
                </div>
              </div>
            )}

            {panelTab === 'History' && selected.id && (
              <VersionHistory
                contentType="lot"
                contentId={selected.id}
                onRestore={prev => {
                  try {
                    const restored = JSON.parse(prev) as Partial<LotRow>
                    setSelected(s => ({ ...s, ...restored }))
                    showToast('Restored ✓')
                  } catch { showToast('Could not restore') }
                }}
              />
            )}

            {panelTab !== 'History' && (
              <div className="flex gap-3 pt-2">
                <SaveButton onClick={() => void save()} saving={saving} />
                <button type="button" onClick={closePanel} className="px-4 py-2 rounded-md text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </SlidePanel>
    </div>
  )
}
