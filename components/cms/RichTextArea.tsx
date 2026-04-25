'use client'

import { useState } from 'react'

interface RichTextAreaProps {
  value: string
  onChange: (val: string) => void
  label: string
  placeholder?: string
  rows?: number
  fieldName: string
  aiContext?: string
  showAiEnhance?: boolean
  hint?: string
}

interface DiffView {
  original: string
  enhanced: string
}

export default function RichTextArea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  fieldName,
  aiContext,
  showAiEnhance = false,
  hint,
}: RichTextAreaProps) {
  const [enhancing, setEnhancing] = useState(false)
  const [diffView, setDiffView] = useState<DiffView | null>(null)
  const [error, setError] = useState('')

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  async function handleAiEnhance() {
    if (!value.trim()) return
    setEnhancing(true)
    setError('')

    try {
      const res = await fetch('/api/cms/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: value,
          fieldName,
          context: aiContext ?? 'Midas Property Auctions',
        }),
      })
      const data = await res.json() as { enhanced?: string; error?: string }

      if (data.enhanced && data.enhanced !== value) {
        setDiffView({ original: value, enhanced: data.enhanced })
      } else if (data.error) {
        setError(data.error)
      }
    } catch {
      setError('AI enhancement failed — please try again')
    } finally {
      setEnhancing(false)
    }
  }

  function applyEnhancement() {
    if (diffView) {
      onChange(diffView.enhanced)
      setDiffView(null)
    }
  }

  return (
    <div>
      {/* Label row */}
      <div className="flex justify-between items-center mb-1">
        <label
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--color-text-dim)' }}
        >
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {showAiEnhance && (
            <button
              type="button"
              disabled={enhancing || !value.trim()}
              onClick={() => void handleAiEnhance()}
              className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-60"
              style={{
                border: '1px solid rgba(201,168,76,0.4)',
                color: enhancing ? 'rgba(201,168,76,0.6)' : '#C9A84C',
                backgroundColor: 'transparent',
              }}
            >
              {enhancing ? '✨ Enhancing…' : '✨ AI Enhance'}
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md text-sm resize-y focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          padding: '10px 12px',
        }}
      />

      {/* Hint */}
      {hint && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* AI diff view */}
      {diffView !== null && (
        <div
          className="mt-3 rounded-lg p-4 space-y-3"
          style={{
            backgroundColor: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: '#C9A84C' }}
          >
            AI Suggestion:
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#E8C96A' }}>
            {diffView.enhanced}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={applyEnhancement}
              className="bg-[#C9A84C] text-[#080809] text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#E8C96A] transition-colors"
            >
              ✓ Apply
            </button>
            <button
              type="button"
              onClick={() => setDiffView(null)}
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Keep original
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
