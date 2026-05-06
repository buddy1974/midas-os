'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Clock } from 'lucide-react'

interface HistoryEntry {
  id: string
  label: string | null
  changedBy: string | null
  previousValue: string | null
  changedAt: string
}

interface VersionHistoryProps {
  contentType: string
  contentId: string
  onRestore: (previousValue: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function VersionHistory({ contentType, contentId, onRestore }: VersionHistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (!contentId) return
    setLoading(true)
    fetch(`/api/cms/history?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setEntries(data as HistoryEntry[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [contentType, contentId])

  async function handleRestore(entry: HistoryEntry) {
    if (!entry.previousValue) return
    setRestoring(true)
    try {
      await fetch('/api/cms/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId: entry.id }),
      })
      onRestore(entry.previousValue)
      setConfirming(null)
    } catch {
      // silent — caller handles feedback
    } finally {
      setRestoring(false)
    }
  }

  if (loading) {
    return <p className="text-xs py-4 text-center" style={{ color: 'var(--color-text-dim)' }}>Loading history…</p>
  }

  if (entries.length === 0) {
    return (
      <div className="py-6 text-center">
        <Clock size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-dim)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>No history yet — saves will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--color-text-dim)' }}>
        Version History
      </p>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg p-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {entry.label ?? 'Updated'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                {timeAgo(entry.changedAt)} {entry.changedBy ? `· ${entry.changedBy}` : ''}
              </p>
            </div>
            {entry.previousValue && (
              <div>
                {confirming === entry.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={restoring}
                      onClick={() => void handleRestore(entry)}
                      className="text-xs px-2 py-1 rounded font-semibold transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}
                    >
                      {restoring ? 'Restoring…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(entry.id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
