'use client'

import { useState } from 'react'
import ImageUploadField from './ImageUploadField'
import RichTextArea from './RichTextArea'

interface Testimonial {
  id: string
  name: string
  location: string
  text: string
  rating: number
  isActive: boolean
  source: string
  photoUrl?: string | null
  googleReviewUrl?: string | null
}

interface ReviewCardProps {
  review: Testimonial
  onUpdate: (updated: Partial<Testimonial>) => Promise<void>
  onDelete: () => Promise<void>
}

type ReviewSource = 'Direct' | 'Google' | 'Email' | 'Event'
const SOURCES: ReviewSource[] = ['Direct', 'Google', 'Email', 'Event']

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export default function ReviewCard({ review, onUpdate, onDelete }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState<Testimonial>({ ...review })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const inputClass =
    'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--color-border)] text-[var(--color-text)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]'

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdate(editing)
      setExpanded(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  function handleCancel() {
    setEditing({ ...review })
    setExpanded(false)
    setConfirmDelete(false)
  }

  const preview = review.text.length > 80 ? review.text.slice(0, 80) + '…' : review.text
  const stars = '★'.repeat(review.rating) + '☆'.repeat(Math.max(0, 5 - review.rating))

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* ── Collapsed view ── */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="shrink-0">
          {review.photoUrl ? (
            <img
              src={review.photoUrl}
              alt={review.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: '#C9A84C', color: '#080809' }}
            >
              {getInitials(review.name)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: '#C9A84C' }}>
            {stars}
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {review.name}{' '}
            <span className="font-normal text-xs" style={{ color: 'var(--color-text-dim)' }}>
              {review.location}
            </span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
            {preview}
          </p>
        </div>

        {/* Right */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium"
            style={
              review.isActive
                ? {
                    backgroundColor: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.4)',
                    color: 'rgb(134,239,172)',
                  }
                : {
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--color-text-dim)',
                  }
            }
          >
            {review.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#C9A84C',
            }}
          >
            {expanded ? 'Close ▴' : 'Edit ▾'}
          </button>
        </div>
      </div>

      {/* ── Expanded edit form ── */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="pt-4" />

          {/* Row 1: photo + star rating */}
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              label="Photo"
              value={editing.photoUrl ?? ''}
              onChange={(url) => setEditing({ ...editing, photoUrl: url || null })}
              aspectRatio="1:1"
            />
            <div>
              <label
                className="block mb-2 text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: 'var(--color-text-dim)' }}
              >
                Rating
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditing({ ...editing, rating: i + 1 })}
                    className="text-2xl transition-colors leading-none"
                    style={{
                      color: i < editing.rating ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                    }}
                    aria-label={`Set rating to ${i + 1}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                {editing.rating} / 5
              </p>
            </div>
          </div>

          {/* Source select */}
          <div>
            <label
              className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Source
            </label>
            <select
              className={inputClass}
              value={editing.source}
              onChange={(e) => setEditing({ ...editing, source: e.target.value })}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Google review URL */}
          {editing.source === 'Google' && (
            <div>
              <label
                className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: 'var(--color-text-dim)' }}
              >
                Google Review URL
              </label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://g.page/r/..."
                value={editing.googleReviewUrl ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, googleReviewUrl: e.target.value || null })
                }
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label
              className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              className={inputClass}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </div>

          {/* Location */}
          <div>
            <label
              className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Location
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="London, Essex…"
              value={editing.location}
              onChange={(e) => setEditing({ ...editing, location: e.target.value })}
            />
          </div>

          {/* Review text */}
          <RichTextArea
            label="Review Text"
            value={editing.text}
            onChange={(val) => setEditing({ ...editing, text: val })}
            fieldName="testimonial_text"
            aiContext="property investment testimonial"
            rows={4}
            showAiEnhance
            placeholder="What did the client say…"
          />

          {/* isActive toggle */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Show on website
            </span>
            <button
              type="button"
              onClick={() => setEditing({ ...editing, isActive: !editing.isActive })}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{
                backgroundColor: editing.isActive
                  ? 'rgba(201,168,76,0.6)'
                  : 'rgba(255,255,255,0.1)',
              }}
              aria-pressed={editing.isActive}
              aria-label="Toggle visibility on website"
            >
              <span
                className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
                style={{
                  backgroundColor: editing.isActive ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                  transform: editing.isActive ? 'translateX(18px)' : 'translateX(3px)',
                }}
              />
            </button>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={saving || !editing.name.trim()}
              onClick={() => void handleSave()}
              className="bg-[#C9A84C] text-[#080809] text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#E8C96A] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

            {confirmDelete ? (
              <>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="border border-red-500/40 text-red-400 text-xs px-3 py-1.5 rounded hover:border-red-400 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="border border-red-500/40 text-red-400 text-xs px-3 py-1.5 rounded hover:border-red-400 transition-colors"
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
