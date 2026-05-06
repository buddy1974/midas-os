'use client'

import { useRef, useState } from 'react'

interface VideoFieldProps {
  value: string
  onChange: (val: string) => void
  label: string
  hint?: string
}

function youtubeIdFromUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function vimeoIdFromUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function buildEmbed(raw: string): string {
  const ytId = youtubeIdFromUrl(raw)
  if (ytId) return `https://www.youtube.com/embed/${ytId}`
  const vId = vimeoIdFromUrl(raw)
  if (vId) return `https://player.vimeo.com/video/${vId}`
  return raw
}

function PreviewEmbed({ src }: { src: string }) {
  if (!src) return null
  if (src.includes('youtube.com/embed/') || src.includes('player.vimeo.com')) {
    return (
      <iframe
        src={src}
        className="w-full rounded-lg"
        style={{ aspectRatio: '16/9', border: '1px solid var(--color-border)' }}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    )
  }
  if (src.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video
        src={src}
        controls
        className="w-full rounded-lg"
        style={{ border: '1px solid var(--color-border)' }}
      />
    )
  }
  return (
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
      Video set — preview not available for this URL type.
    </p>
  )
}

const inputClass =
  'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--color-border)] text-[var(--color-text)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]'

export default function VideoField({ value, onChange, label, hint }: VideoFieldProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url')
  const [rawInput, setRawInput] = useState(value)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const embedSrc = value ? buildEmbed(value) : ''

  function handleUrlInput(raw: string) {
    setRawInput(raw)
    const ytId = youtubeIdFromUrl(raw)
    if (ytId) {
      onChange(`https://www.youtube.com/embed/${ytId}`)
      return
    }
    const vId = vimeoIdFromUrl(raw)
    if (vId) {
      onChange(`https://player.vimeo.com/video/${vId}`)
      return
    }
    if (raw.startsWith('http')) onChange(raw)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        onChange(data.url)
        setRawInput(data.url)
      } else {
        setUploadError('Upload failed')
      }
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      {label && (
        <label className="block mb-1 text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
          {label}
        </label>
      )}
      {hint && <p className="mb-2 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>{hint}</p>}

      <div className="flex gap-2 mb-3">
        {(['url', 'upload'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              backgroundColor: tab === t ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: tab === t ? '#C9A84C' : 'var(--color-text-dim)',
              border: `1px solid ${tab === t ? 'rgba(201,168,76,0.4)' : 'var(--color-border)'}`,
            }}
          >
            {t === 'url' ? 'Paste URL' : 'Upload Video'}
          </button>
        ))}
      </div>

      {tab === 'url' && (
        <input
          type="text"
          className={inputClass}
          placeholder="YouTube, Vimeo, or direct video URL..."
          value={rawInput}
          onChange={(e) => handleUrlInput(e.target.value)}
        />
      )}

      {tab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => void handleFileSelect(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
            style={{ border: '2px dashed rgba(201,168,76,0.2)', backgroundColor: 'rgba(201,168,76,0.02)' }}
          >
            {uploading ? (
              <p className="text-xs" style={{ color: '#C9A84C' }}>Uploading…</p>
            ) : (
              <>
                <span className="text-base opacity-60">🎬</span>
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Click to upload · MP4 WebM</span>
              </>
            )}
          </button>
          {uploadError && <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{uploadError}</p>}
        </div>
      )}

      {value && (
        <div className="mt-3 space-y-2">
          <PreviewEmbed src={embedSrc} />
          <button
            type="button"
            onClick={() => { onChange(''); setRawInput('') }}
            className="text-xs px-3 py-1 rounded border transition-colors"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
          >
            Remove video
          </button>
        </div>
      )}
    </div>
  )
}
