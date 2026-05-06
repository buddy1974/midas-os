'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import RichTextArea from '@/components/cms/RichTextArea'
import VersionHistory from '@/components/cms/VersionHistory'
import {
  useToast, Toast, Toggle, SaveButton, Card, FieldInput,
  SlidePanel, PanelTabs,
} from '../_shared'

interface TeamMember {
  id: string
  name: string
  role: string | null
  bio: string | null
  phone: string | null
  email: string | null
  linkedin: string | null
  photoUrl: string | null
  isActive: boolean
  showOnWebsite: boolean
  sortOrder: number
}

type PanelTab = 'Details' | 'History'

function emptyMember(): Partial<TeamMember> {
  return { name: '', role: '', bio: '', phone: '', email: '', linkedin: '', photoUrl: '', isActive: true, showOnWebsite: true, sortOrder: 0 }
}

export default function TeamTab() {
  const { toast, showToast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partial<TeamMember> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('Details')
  const [saving, setSaving] = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/cms/team')
      const data = await r.json() as TeamMember[]
      setMembers(Array.isArray(data) ? data.sort((a, b) => a.sortOrder - b.sortOrder) : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function openNew() { setSelected(emptyMember()); setIsNew(true); setPanelTab('Details') }
  function openEdit(m: TeamMember) { setSelected({ ...m }); setIsNew(false); setPanelTab('Details') }
  function closePanel() { setSelected(null) }
  function patch<K extends keyof TeamMember>(k: K, v: TeamMember[K]) {
    setSelected(prev => prev ? { ...prev, [k]: v } : prev)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      if (isNew) {
        await fetch('/api/cms/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
        })
      } else {
        await fetch(`/api/cms/team/${selected.id}`, {
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

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Remove ${name} from the About page?\nThis does not affect their OS login.`)) return
    await fetch(`/api/cms/team/${id}`, { method: 'DELETE' })
    void load()
  }

  async function toggleWebsite(m: TeamMember) {
    await fetch(`/api/cms/team/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showOnWebsite: !m.showOnWebsite }),
    })
    void load()
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6">
      <Toast message={toast} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Your Team</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>Controls the About page — not OS logins</p>
        </div>
        <button type="button" onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
          <Plus size={14} /> Add Team Member
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading…</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {members.map(m => (
            <div key={m.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <GripVertical size={14} style={{ color: 'var(--color-text-dim)' }} className="shrink-0" />
              {m.photoUrl ? (
                <img src={m.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                  {initials(m.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{m.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{m.role ?? ''}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                <span>Web</span>
                <Toggle checked={m.showOnWebsite} onChange={() => void toggleWebsite(m)} />
              </div>
              <button type="button" onClick={() => openEdit(m)} className="p-1.5 hover:text-[#C9A84C]" style={{ color: 'var(--color-text-dim)' }}><Pencil size={14} /></button>
              <button type="button" onClick={() => void deleteMember(m.id, m.name)} className="p-1.5 hover:text-red-400" style={{ color: 'var(--color-text-dim)' }}><Trash2 size={14} /></button>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>No team members yet.</p>}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={closePanel} title={isNew ? 'Add Team Member' : 'Edit Team Member'}>
        {selected && (
          <>
            <PanelTabs tabs={['Details', 'History']} active={panelTab} onChange={t => setPanelTab(t as PanelTab)} />

            {panelTab === 'Details' && (
              <div className="space-y-4">
                <ImageUploadField label="Photo (1:1)" value={selected.photoUrl ?? ''} onChange={v => patch('photoUrl', v)} aspectRatio="1:1" hint="Square photo — shown as circle on website" />
                <FieldInput label="Full Name" value={selected.name ?? ''} onChange={v => patch('name', v)} />
                <FieldInput label="Job Title / Role" value={selected.role ?? ''} onChange={v => patch('role', v)} />
                <RichTextArea
                  label="Biography"
                  value={selected.bio ?? ''}
                  onChange={v => patch('bio', v)}
                  fieldName="team_bio"
                  showAiEnhance
                  rows={4}
                  placeholder="Paste key facts and AI will write a professional bio"
                />
                <FieldInput label="Phone" value={selected.phone ?? ''} onChange={v => patch('phone', v)} type="tel" />
                <FieldInput label="Email" value={selected.email ?? ''} onChange={v => patch('email', v)} type="email" />
                <FieldInput label="LinkedIn URL" value={selected.linkedin ?? ''} onChange={v => patch('linkedin', v)} type="url" />
                <div className="flex items-center gap-3">
                  <Toggle checked={!!(selected.showOnWebsite)} onChange={() => patch('showOnWebsite', !(selected.showOnWebsite))} />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>Show on website</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <SaveButton onClick={() => void save()} saving={saving} />
                  <button type="button" onClick={closePanel} className="px-4 py-2 rounded-md text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>Cancel</button>
                </div>
              </div>
            )}

            {panelTab === 'History' && selected.id && (
              <VersionHistory
                contentType="team"
                contentId={selected.id}
                onRestore={prev => {
                  try { setSelected(s => ({ ...s, ...JSON.parse(prev) as Partial<TeamMember> })); showToast('Restored ✓') }
                  catch { showToast('Could not restore') }
                }}
              />
            )}
          </>
        )}
      </SlidePanel>
    </div>
  )
}
