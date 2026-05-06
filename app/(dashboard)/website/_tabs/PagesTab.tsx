'use client'

import { useState } from 'react'
import { useToast, Toast, SaveButton, Card, FieldInput, FieldTextarea, SectionLabel } from '../_shared'

interface MenuItem {
  label: string
  url: string
  visible: boolean
}

const DEFAULT_MENU: MenuItem[] = [
  { label: 'Properties', url: '/properties', visible: true },
  { label: 'Off-Market', url: '/off-market', visible: true },
  { label: 'Sell', url: '/sell', visible: true },
  { label: 'Finance', url: '/finance', visible: true },
  { label: 'Events', url: '/events', visible: true },
  { label: 'About', url: '/about', visible: true },
  { label: 'Contact', url: '/contact', visible: true },
]

export default function PagesTab() {
  const { toast, showToast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU)
  const [savingMenu, setSavingMenu] = useState(false)
  const [pageName, setPageName] = useState('')
  const [pageDesc, setPageDesc] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)

  function updateItem(i: number, field: keyof MenuItem, val: string | boolean) {
    setMenuItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  function addItem() {
    setMenuItems(prev => [...prev, { label: 'New Page', url: '/', visible: true }])
  }

  function removeItem(i: number) {
    setMenuItems(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveMenu() {
    setSavingMenu(true)
    try {
      await fetch('/api/cms/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuItems }),
      })
      showToast('Menu saved ✓')
    } catch { showToast('Save failed') }
    setSavingMenu(false)
  }

  async function sendRequest() {
    if (!pageName.trim()) return
    setSendingRequest(true)
    try {
      await fetch('/api/cms/page-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageName, description: pageDesc }),
      })
      setRequestSent(true)
      setPageName('')
      setPageDesc('')
    } catch { showToast('Failed to send request') }
    setSendingRequest(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Toast message={toast} />

      {/* Navigation Manager */}
      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Navigation Menu</h2>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>What appears in your website menu</p>

        <div className="space-y-2 mt-3">
          {menuItems.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}
            >
              <span className="text-base select-none" style={{ color: 'var(--color-text-dim)' }}>⠿</span>
              <input
                value={item.label}
                onChange={e => updateItem(i, 'label', e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text)' }}
              />
              <input
                value={item.url}
                onChange={e => updateItem(i, 'url', e.target.value)}
                className="w-36 bg-transparent text-xs outline-none"
                style={{ color: 'var(--color-text-dim)' }}
              />
              <button
                type="button"
                onClick={() => updateItem(i, 'visible', !item.visible)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: item.visible ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                  color: item.visible ? '#22c55e' : '#6b7280',
                }}
              >
                {item.visible ? 'Visible' : 'Hidden'}
              </button>
              <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-400 px-2">×</button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button type="button" onClick={addItem} className="text-xs px-3 py-1.5 rounded" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
            + Add item
          </button>
          <SaveButton onClick={() => void saveMenu()} saving={savingMenu} label="Save Menu" />
        </div>
      </Card>

      {/* Page Request */}
      <Card>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Request a New Page or Feature</h2>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Need something custom? Submit a request to Marcel.</p>

        {requestSent ? (
          <div className="py-4 text-center">
            <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Request sent to Marcel ✓</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>Usually completed within 24 hours.</p>
            <button type="button" onClick={() => setRequestSent(false)} className="mt-3 text-xs" style={{ color: '#C9A84C' }}>Send another</button>
          </div>
        ) : (
          <div className="space-y-3">
            <FieldInput label="Page / Feature name" value={pageName} onChange={setPageName} placeholder="e.g. Portfolio calculator page" />
            <FieldTextarea label="Description" value={pageDesc} onChange={setPageDesc} placeholder="What should it do? Any requirements?" rows={3} />
            <button
              type="button"
              onClick={() => void sendRequest()}
              disabled={sendingRequest || !pageName.trim()}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#C9A84C', color: '#080809' }}
            >
              {sendingRequest ? 'Sending…' : 'Submit Request →'}
            </button>
          </div>
        )}
      </Card>

      {/* Footer note */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <SectionLabel>Footer Links</SectionLabel>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Footer link management coming in the next update. Contact Marcel to update footer links in the meantime.
        </p>
      </div>
    </div>
  )
}
