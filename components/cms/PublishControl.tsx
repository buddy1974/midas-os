'use client'

import { useState } from 'react'

type PublishStatus = 'draft' | 'published' | 'archived'

interface PublishControlProps {
  status: PublishStatus
  onChange: (status: PublishStatus) => void
  publishedAt?: string
  showSchedule?: boolean
}

const STATUS_CONFIG: Record<
  PublishStatus,
  { label: string; bg: string; border: string; text: string; leftBorder: string }
> = {
  published: {
    label: '● Published',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.4)',
    text: 'rgb(134,239,172)',
    leftBorder: 'rgb(34,197,94)',
  },
  draft: {
    label: '◐ Draft',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.3)',
    text: 'rgb(253,224,71)',
    leftBorder: 'rgb(251,191,36)',
  },
  archived: {
    label: '○ Archived',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.15)',
    text: 'var(--color-text-dim)',
    leftBorder: 'rgba(255,255,255,0.2)',
  },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function PublishControl({
  status,
  onChange,
  publishedAt,
  showSchedule = false,
}: PublishControlProps) {
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)

  const config = STATUS_CONFIG[status]

  return (
    <div className="relative">
      <div
        className="rounded-lg p-4 flex items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: `4px solid ${config.leftBorder}`,
        }}
      >
        {/* Left: status + date */}
        <div className="flex flex-col gap-1">
          <span
            className="inline-flex items-center self-start px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: config.bg,
              border: `1px solid ${config.border}`,
              color: config.text,
            }}
          >
            {config.label}
          </span>
          {publishedAt && status === 'published' && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
              Published {formatDate(publishedAt)}
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {status === 'draft' && (
            <>
              <button
                type="button"
                onClick={() => onChange('published')}
                className="bg-[#C9A84C] text-[#080809] text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#E8C96A] transition-colors"
              >
                Publish Now →
              </button>
              <button
                type="button"
                onClick={() => onChange('archived')}
                className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
              >
                Archive
              </button>
            </>
          )}

          {status === 'published' && (
            <>
              <button
                type="button"
                onClick={() => setConfirmUnpublish(true)}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  border: '1px solid rgba(251,191,36,0.4)',
                  color: 'rgb(253,224,71)',
                }}
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={() => onChange('archived')}
                className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
              >
                Archive
              </button>
            </>
          )}

          {status === 'archived' && (
            <>
              <button
                type="button"
                onClick={() => onChange('draft')}
                className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
              >
                Restore to Draft
              </button>
              <button
                type="button"
                onClick={() => onChange('published')}
                className="bg-[#C9A84C] text-[#080809] text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#E8C96A] transition-colors"
              >
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unpublish confirm dialog */}
      {confirmUnpublish && (
        <div
          className="mt-2 rounded-lg p-4 space-y-3"
          style={{
            backgroundColor: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.3)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            This will hide the content from the website. Continue?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { onChange('draft'); setConfirmUnpublish(false) }}
              className="text-xs px-3 py-1.5 rounded transition-colors font-semibold"
              style={{
                backgroundColor: 'rgba(251,191,36,0.2)',
                border: '1px solid rgba(251,191,36,0.4)',
                color: 'rgb(253,224,71)',
              }}
            >
              Yes, unpublish
            </button>
            <button
              type="button"
              onClick={() => setConfirmUnpublish(false)}
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedule placeholder — only UI hint, no logic unless showSchedule is true */}
      {showSchedule && status === 'draft' && (
        <p className="mt-2 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
          Schedule publishing coming soon
        </p>
      )}
    </div>
  )
}
