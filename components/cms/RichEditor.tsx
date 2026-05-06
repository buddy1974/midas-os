'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ImageUploadField from './ImageUploadField'
import VideoField from './VideoField'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  fieldName?: string
  showAiEnhance?: boolean
  aiContext?: string
}

type ActiveModal = 'link' | 'image' | 'video' | null

function youtubeEmbedFromUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

function buildVideoHtml(val: string): string {
  if (!val) return ''
  const ytEmbed = youtubeEmbedFromUrl(val)
  const src = ytEmbed ?? val
  if (src.includes('youtube.com/embed') || src.includes('player.vimeo.com')) {
    return `<iframe src="${src}" width="100%" height="400" frameborder="0" allowfullscreen style="display:block;margin:12px 0;border-radius:8px;"></iframe>`
  }
  if (val.match(/\.(mp4|webm|ogg)$/i)) {
    return `<video src="${val}" controls style="width:100%;display:block;margin:12px 0;border-radius:8px;"></video>`
  }
  return ''
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  fieldName = 'content',
  showAiEnhance = false,
  aiContext,
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState('')
  const savedSelectionRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  function restoreSelection() {
    const range = savedSelectionRef.current
    if (!range) return
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  function insertHtml(html: string) {
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand('insertHTML', false, html)
    syncValue()
  }

  function syncValue() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  function execCmd(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    syncValue()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  function openModal(modal: ActiveModal) {
    saveSelection()
    setActiveModal(modal)
  }

  function insertLink() {
    if (!linkUrl) return
    const display = linkText || linkUrl
    insertHtml(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${display}</a>&nbsp;`)
    setLinkUrl('')
    setLinkText('')
    setActiveModal(null)
  }

  function insertImage() {
    if (!imageUrl) return
    insertHtml(`<img src="${imageUrl}" alt="" style="max-width:100%;display:block;margin:8px 0;border-radius:6px;" />`)
    setImageUrl('')
    setActiveModal(null)
  }

  function insertVideo() {
    const html = buildVideoHtml(videoUrl)
    if (html) insertHtml(html)
    setVideoUrl('')
    setActiveModal(null)
  }

  async function handleAiEnhance() {
    const text = editorRef.current?.innerText ?? ''
    if (!text.trim()) return
    setEnhancing(true)
    setEnhanceError('')
    try {
      const res = await fetch('/api/cms/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, fieldName, context: aiContext ?? 'Midas Property Auctions' }),
      })
      const data = await res.json() as { enhanced?: string; error?: string }
      if (data.enhanced && editorRef.current) {
        editorRef.current.innerHTML = data.enhanced
        onChange(data.enhanced)
      } else if (data.error) {
        setEnhanceError(data.error)
      }
    } catch {
      setEnhanceError('AI enhancement failed')
    } finally {
      setEnhancing(false)
    }
  }

  const toolbarBtn = (label: string, onClick: () => void, title?: string) => (
    <button
      key={label}
      type="button"
      title={title ?? label}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[rgba(201,168,76,0.15)] hover:text-[#C9A84C]"
      style={{ color: 'var(--color-text-dim)', minWidth: '28px' }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}
      >
        {toolbarBtn('B', () => execCmd('bold'))}
        {toolbarBtn('I', () => execCmd('italic'))}
        {toolbarBtn('U', () => execCmd('underline'))}
        <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
        {toolbarBtn('H1', () => execCmd('formatBlock', 'h1'))}
        {toolbarBtn('H2', () => execCmd('formatBlock', 'h2'))}
        {toolbarBtn('H3', () => execCmd('formatBlock', 'h3'))}
        {toolbarBtn('P', () => execCmd('formatBlock', 'p'))}
        <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
        {toolbarBtn('• List', () => execCmd('insertUnorderedList'))}
        {toolbarBtn('1. List', () => execCmd('insertOrderedList'))}
        <span className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
        {toolbarBtn('🔗', () => openModal('link'), 'Insert link')}
        {toolbarBtn('🖼', () => openModal('image'), 'Insert image')}
        {toolbarBtn('📹', () => openModal('video'), 'Insert video')}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
        {showAiEnhance && (
          <button
            type="button"
            disabled={enhancing}
            onClick={() => void handleAiEnhance()}
            className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-60"
            style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}
          >
            {enhancing ? '✨ Enhancing…' : '✨ AI'}
          </button>
        )}
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className="prose max-w-none p-3 text-sm"
          style={{ minHeight, color: 'var(--color-text)', backgroundColor: 'rgba(255,255,255,0.02)' }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncValue}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: '12px',
            color: 'var(--color-text)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          className="rich-editor focus:ring-0"
        />
      )}

      {enhanceError && (
        <p className="px-3 pb-2 text-xs" style={{ color: '#ef4444' }}>{enhanceError}</p>
      )}

      {/* Modals */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6 space-y-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal === 'link' && (
              <>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Insert Link</h3>
                <input
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <input
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="Link text (optional)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={insertLink} className="bg-[#C9A84C] text-[#080809] text-sm font-semibold px-4 py-2 rounded">Insert</button>
                  <button onClick={() => setActiveModal(null)} className="text-sm px-4 py-2 rounded" style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>Cancel</button>
                </div>
              </>
            )}
            {activeModal === 'image' && (
              <>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Insert Image</h3>
                <ImageUploadField
                  label="Image"
                  value={imageUrl}
                  onChange={setImageUrl}
                />
                <div className="flex gap-2">
                  <button onClick={insertImage} disabled={!imageUrl} className="bg-[#C9A84C] text-[#080809] text-sm font-semibold px-4 py-2 rounded disabled:opacity-50">Insert</button>
                  <button onClick={() => setActiveModal(null)} className="text-sm px-4 py-2 rounded" style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>Cancel</button>
                </div>
              </>
            )}
            {activeModal === 'video' && (
              <>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Insert Video</h3>
                <VideoField
                  label="Video"
                  value={videoUrl}
                  onChange={setVideoUrl}
                />
                <div className="flex gap-2">
                  <button onClick={insertVideo} disabled={!videoUrl} className="bg-[#C9A84C] text-[#080809] text-sm font-semibold px-4 py-2 rounded disabled:opacity-50">Insert</button>
                  <button onClick={() => setActiveModal(null)} className="text-sm px-4 py-2 rounded" style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .rich-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--color-text-dim);
          pointer-events: none;
          opacity: 0.5;
        }
        .rich-editor h1 { font-size: 1.5em; font-weight: 700; margin: 8px 0; }
        .rich-editor h2 { font-size: 1.25em; font-weight: 600; margin: 8px 0; }
        .rich-editor h3 { font-size: 1.1em; font-weight: 600; margin: 6px 0; }
        .rich-editor ul { list-style: disc; padding-left: 1.5em; margin: 6px 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.5em; margin: 6px 0; }
        .rich-editor a { color: #C9A84C; text-decoration: underline; }
      `}</style>
    </div>
  )
}
