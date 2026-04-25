'use client'

import { useRef, useState } from 'react'

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
  label: string
  hint?: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | 'any'
}

export default function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  aspectRatio = 'any',
}: ImageUploadFieldProps) {
  const [pasteUrl, setPasteUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showUploadZone, setShowUploadZone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasValue = value.length > 0
  const showUpload = !hasValue || showUploadZone

  function handlePasteUrl(url: string) {
    setPasteUrl(url)
    if (url.startsWith('http')) {
      onChange(url)
      setPasteUrl('')
      setShowUploadZone(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        onChange(data.url)
        setShowUploadZone(false)
      } else {
        setUploadError('Upload failed — try pasting a URL instead')
      }
    } catch {
      setUploadError('Upload failed — try pasting a URL instead')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const inputClass =
    'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--color-border)] text-[var(--color-text)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]'

  return (
    <div>
      {/* Label */}
      {label && (
        <label
          className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--color-text-dim)' }}
        >
          {label}
        </label>
      )}
      {hint && (
        <p className="mb-2 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
          {hint}
        </p>
      )}

      {/* Preview zone */}
      {hasValue && !showUploadZone ? (
        <div className="mb-3">
          <img
            src={value}
            alt="Preview"
            className="w-full max-h-48 object-cover rounded-lg mb-2"
            style={{ border: '1px solid var(--color-border)' }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUploadZone(true)}
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => { onChange(''); setShowUploadZone(false) }}
              className="border border-red-500/40 text-red-400 text-xs px-3 py-1.5 rounded hover:border-red-400 transition-colors"
            >
              Delete
            </button>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Open ↗
            </a>
          </div>
        </div>
      ) : !hasValue ? (
        <div
          className="h-28 flex items-center justify-center rounded-lg mb-3 cursor-default"
          style={{ border: '2px dashed rgba(201,168,76,0.3)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            📁 No image set
          </span>
        </div>
      ) : null}

      {/* Upload zone — shown when no value OR Change clicked */}
      {showUpload && (
        <div className="space-y-3">
          {/* Paste URL */}
          <div>
            <p
              className="mb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Paste image URL
            </p>
            <input
              type="url"
              className={inputClass}
              placeholder="https://... or Unsplash/Dropbox link"
              value={pasteUrl}
              onChange={(e) => handlePasteUrl(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div>
            <p
              className="mb-1 text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Or upload from device
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
                <div className="w-full px-6">
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}
                  >
                    <div
                      className="h-full rounded-full animate-pulse"
                      style={{ backgroundColor: '#C9A84C', width: '60%' }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: '#C9A84C' }}>
                    Uploading…
                  </p>
                </div>
              ) : (
                <>
                  <span className="text-base opacity-60">📁</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                    Click to upload · JPG PNG WebP
                  </span>
                </>
              )}
            </button>

            {uploadError && (
              <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>
                {uploadError}
              </p>
            )}
          </div>

          {/* Cancel change if we had a value */}
          {hasValue && showUploadZone && (
            <button
              type="button"
              onClick={() => { setShowUploadZone(false); setPasteUrl(''); setUploadError('') }}
              className="border border-[var(--color-border)] text-[var(--color-text-dim)] text-xs px-3 py-1.5 rounded hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Aspect ratio hint */}
      {aspectRatio !== 'any' && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
          Recommended ratio: {aspectRatio}
        </p>
      )}
    </div>
  )
}
