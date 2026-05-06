'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Copy, Trash2, Search } from 'lucide-react'
import { useToast, Toast } from '../_shared'

interface MediaFile {
  url: string
  name: string
  type: 'image' | 'video' | 'other'
  uploadedAt: string
}

export default function MediaTab() {
  const { toast, showToast } = useToast()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('midas_media_library')
    if (stored) {
      try { setFiles(JSON.parse(stored) as MediaFile[]) } catch { /* ignore */ }
    }
  }, [])

  function persist(updated: MediaFile[]) {
    setFiles(updated)
    localStorage.setItem('midas_media_library', JSON.stringify(updated))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    setUploading(true)
    const results: MediaFile[] = []
    for (const file of selected) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await r.json() as { url?: string }
        if (data.url) {
          const isImage = file.type.startsWith('image/')
          const isVideo = file.type.startsWith('video/')
          results.push({
            url: data.url,
            name: file.name,
            type: isImage ? 'image' : isVideo ? 'video' : 'other',
            uploadedAt: new Date().toISOString(),
          })
        }
      } catch { /* continue */ }
    }
    if (results.length) {
      persist([...results, ...files])
      showToast(`${results.length} file${results.length > 1 ? 's' : ''} uploaded ✓`)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url)
    showToast('URL copied ✓')
  }

  function deleteFile(url: string) {
    persist(files.filter(f => f.url !== url))
  }

  const filtered = files.filter(f => {
    if (filter === 'images' && f.type !== 'image') return false
    if (filter === 'videos' && f.type !== 'video') return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6">
      <Toast message={toast} />

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Media Library</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
            Copy URLs and paste them into any content field.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={e => void handleUpload(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C', color: '#080809' }}
          >
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
          <Search size={13} style={{ color: 'var(--color-text-dim)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
          />
        </div>
        {(['all', 'images', 'videos'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors" style={{ backgroundColor: filter === f ? 'rgba(201,168,76,0.15)' : 'transparent', color: filter === f ? '#C9A84C' : 'var(--color-text-dim)', border: `1px solid ${filter === f ? 'rgba(201,168,76,0.4)' : 'var(--color-border)'}` }}>
            {f}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className="mb-6 h-24 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
        style={{ border: '2px dashed rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.02)' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const dt = e.dataTransfer
          if (fileInputRef.current && dt.files.length) {
            const input = fileInputRef.current
            // reassign files via DataTransfer
            const dtNew = new DataTransfer()
            Array.from(dt.files).forEach(f => dtNew.items.add(f))
            input.files = dtNew.files
            input.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }}
      >
        <Upload size={18} style={{ color: 'rgba(201,168,76,0.6)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Drag and drop or click to upload</p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>
          {files.length === 0 ? 'No files uploaded yet.' : 'No files match your filter.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(f => (
            <div key={f.url} className="rounded-lg overflow-hidden group" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {f.type === 'image' ? (
                <img src={f.url} alt={f.name} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center text-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  🎬
                </div>
              )}
              <div className="p-2 space-y-1.5">
                <p className="text-xs truncate" style={{ color: 'var(--color-text)' }}>{f.name}</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => copyUrl(f.url)} className="flex items-center gap-1 text-xs px-2 py-1 rounded flex-1 justify-center transition-colors hover:text-[#C9A84C]" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                    <Copy size={10} /> Copy URL
                  </button>
                  <button type="button" onClick={() => deleteFile(f.url)} className="p-1 rounded transition-colors hover:text-red-400" style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
