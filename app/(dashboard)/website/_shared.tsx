'use client'

import { useCallback, useState } from 'react'
import { Save, ToggleLeft, ToggleRight } from 'lucide-react'

export const WEBSITE_URL = 'https://midas-website-rho.vercel.app'

export function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pence)
}

export function useToast() {
  const [toast, setToast] = useState('')
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])
  return { toast, showToast }
}

export function Toast({ message }: { message: string }) {
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

export function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  const Icon = checked ? ToggleRight : ToggleLeft
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: checked ? '#C9A84C' : 'var(--color-text-dim)' }}
    >
      <Icon size={22} />
    </button>
  )
}

export function SaveButton({
  onClick, saving, saved, label = 'Save',
}: {
  onClick: () => void
  saving?: boolean
  saved?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
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

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-5 space-y-4 ${className}`}
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
      {children}
    </p>
  )
}

export function FieldInput({
  label, value, onChange, type = 'text', placeholder, helper,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <SectionLabel>{label}</SectionLabel>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />
      {helper && <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{helper}</p>}
    </div>
  )
}

export function FieldTextarea({
  label, value, onChange, placeholder, rows = 3, helper,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number; helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <SectionLabel>{label}</SectionLabel>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      />
      {helper && <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{helper}</p>}
    </div>
  )
}

export function FieldSelect({
  label, value, onChange, options, helper,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; helper?: string
}) {
  return (
    <div className="space-y-1.5">
      <SectionLabel>{label}</SectionLabel>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {helper && <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>{helper}</p>}
    </div>
  )
}

export function SlidePanel({
  open, onClose, title, subtitle, children, width = 480,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string
  children: React.ReactNode; width?: number
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col overflow-y-auto"
        style={{ width: `min(${width}px, 100vw)`, backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
      >
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-xl leading-none ml-4" style={{ color: 'var(--color-text-dim)' }}>×</button>
        </div>
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

export function PanelTabs({
  tabs, active, onChange,
}: {
  tabs: string[]; active: string; onChange: (t: string) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
      {tabs.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: active === t ? 'rgba(201,168,76,0.15)' : 'transparent',
            color: active === t ? '#C9A84C' : 'var(--color-text-dim)',
            border: `1px solid ${active === t ? 'rgba(201,168,76,0.4)' : 'transparent'}`,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: color + '22', color }}>
      {children}
    </span>
  )
}
