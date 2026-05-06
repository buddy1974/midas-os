'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import ImageUploadField from '@/components/cms/ImageUploadField'
import RichEditor from '@/components/cms/RichEditor'
import VideoField from '@/components/cms/VideoField'
import VersionHistory from '@/components/cms/VersionHistory'
import {
  useToast, Toast, SaveButton, Card, FieldInput, FieldTextarea,
  FieldSelect, SlidePanel, PanelTabs, Badge,
} from '../_shared'

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string | null
  excerpt: string | null
  content: string | null
  coverImage: string | null
  isPublished: boolean
  publishedAt: string | null
  author: string | null
  seoTitle: string | null
  seoDescription: string | null
  keywords: string | null
  tags: string | null
  videoUrl?: string | null
  createdAt: string
}

type PanelTab = 'Content' | 'SEO' | 'History'

const CATEGORIES = [
  { value: '', label: '— Select category —' },
  { value: 'Guide', label: 'Guide' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Market', label: 'Market' },
  { value: 'News', label: 'News' },
  { value: 'Events', label: 'Events' },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function emptyPost(): Partial<BlogPost> {
  return { title: '', slug: '', category: '', excerpt: '', content: '', coverImage: '', isPublished: false, author: 'Midas Property Auctions', seoTitle: '', seoDescription: '', keywords: '[]', tags: '[]', videoUrl: '' }
}

export default function BlogTab() {
  const { toast, showToast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partial<BlogPost> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('Content')
  const [saving, setSaving] = useState(false)
  const [genSeo, setGenSeo] = useState(false)
  const [showSeo, setShowSeo] = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/cms/posts')
      const data = await r.json() as BlogPost[]
      setPosts(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  function openNew() { setSelected(emptyPost()); setIsNew(true); setPanelTab('Content') }
  function openEdit(p: BlogPost) { setSelected({ ...p }); setIsNew(false); setPanelTab('Content') }
  function closePanel() { setSelected(null) }
  function patch<K extends keyof BlogPost>(k: K, v: BlogPost[K]) {
    setSelected(prev => prev ? { ...prev, [k]: v } : prev)
  }

  function handleTitleChange(v: string) {
    patch('title', v)
    if (isNew) patch('slug', slugify(v))
  }

  async function save(publish = false) {
    if (!selected) return
    setSaving(true)
    try {
      const body = { ...selected }
      if (publish) { body.isPublished = true; body.publishedAt = new Date().toISOString() }
      if (isNew) {
        await fetch('/api/cms/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch(`/api/cms/posts/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      showToast(publish ? 'Published ✓' : 'Saved ✓')
      closePanel()
      void load()
    } catch { showToast('Save failed') }
    setSaving(false)
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/cms/posts/${id}`, { method: 'DELETE' })
    void load()
  }

  async function generateSeo() {
    if (!selected?.content && !selected?.title) return
    setGenSeo(true)
    try {
      const r = await fetch('/api/cms/ai-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selected.title, content: selected.content, fieldName: 'blog_post' }),
      })
      const data = await r.json() as { seoTitle?: string; seoDescription?: string; keywords?: string[] }
      if (data.seoTitle) patch('seoTitle', data.seoTitle)
      if (data.seoDescription) patch('seoDescription', data.seoDescription)
      if (data.keywords) patch('keywords', JSON.stringify(data.keywords))
      showToast('SEO generated ✓')
    } catch { showToast('SEO generation failed') }
    setGenSeo(false)
  }

  const keywords: string[] = (() => { try { return JSON.parse(selected?.keywords ?? '[]') as string[] } catch { return [] } })()

  return (
    <div className="p-6">
      <Toast message={toast} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Blog Posts ({posts.length})</h2>
        <button type="button" onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
          <Plus size={14} /> Write New Post
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Loading…</p>
      ) : (
        <div className="space-y-2 max-w-3xl">
          <div className="grid grid-cols-5 gap-3 px-4 py-2 text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--color-text-dim)' }}>
            <span className="col-span-2">Title</span><span>Category</span><span>Status</span><span>Actions</span>
          </div>
          {posts.map(p => (
            <div key={p.id} className="grid grid-cols-5 gap-3 items-center rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="col-span-2 text-sm truncate" style={{ color: 'var(--color-text)' }}>{p.title}</p>
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{p.category ?? '—'}</span>
              <Badge color={p.isPublished ? '#22c55e' : '#6b7280'}>{p.isPublished ? 'Published' : 'Draft'}</Badge>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(p)} className="p-1.5 hover:text-[#C9A84C]" style={{ color: 'var(--color-text-dim)' }}><Pencil size={13} /></button>
                <button type="button" onClick={() => void deletePost(p.id)} className="p-1.5 hover:text-red-400" style={{ color: 'var(--color-text-dim)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-dim)' }}>No posts yet.</p>}
        </div>
      )}

      <SlidePanel open={!!selected} onClose={closePanel} title={isNew ? 'New Post' : 'Edit Post'} width={600}>
        {selected && (
          <>
            <PanelTabs tabs={['Content', 'SEO', 'History']} active={panelTab} onChange={t => setPanelTab(t as PanelTab)} />

            {panelTab === 'Content' && (
              <div className="space-y-4">
                <div>
                  <input
                    value={selected.title ?? ''}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Post title..."
                    className="w-full bg-transparent text-xl font-bold outline-none"
                    style={{ color: 'var(--color-text)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                    URL: /blog/{selected.slug || '—'}
                    {selected.slug && (
                      <input value={selected.slug} onChange={e => patch('slug', e.target.value)} className="ml-2 bg-transparent outline-none text-xs underline" style={{ color: '#C9A84C' }} />
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldSelect label="Category" value={selected.category ?? ''} onChange={v => patch('category', v)} options={CATEGORIES} />
                  <FieldInput label="Author" value={selected.author ?? ''} onChange={v => patch('author', v)} />
                </div>
                <ImageUploadField label="Cover Image (16:9)" value={selected.coverImage ?? ''} onChange={v => patch('coverImage', v)} aspectRatio="16:9" />
                <VideoField label="Or use a cover video" value={selected.videoUrl ?? ''} onChange={v => patch('videoUrl' as keyof BlogPost, v as BlogPost[keyof BlogPost])} />
                <FieldTextarea label="Excerpt" value={selected.excerpt ?? ''} onChange={v => patch('excerpt', v)} rows={2} placeholder="Short summary shown in blog list…" />
                <RichEditor
                  value={selected.content ?? ''}
                  onChange={v => patch('content', v)}
                  placeholder="Write your article here…"
                  minHeight={300}
                  fieldName="blog_post"
                  showAiEnhance
                />
                <div className="flex gap-3 pt-2 flex-wrap">
                  <SaveButton onClick={() => void save(false)} saving={saving} label="Save Draft" />
                  <button type="button" onClick={() => void save(true)} disabled={saving} className="px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
                    {selected.isPublished ? 'Update Published' : 'Publish →'}
                  </button>
                  <button type="button" onClick={() => setShowSeo(s => !s)} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-md" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                    {showSeo ? <EyeOff size={12} /> : <Eye size={12} />} SEO
                  </button>
                  <button type="button" onClick={closePanel} className="px-4 py-2 rounded-md text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>Cancel</button>
                </div>

                {showSeo && (
                  <Card>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>SEO Settings</p>
                      <button type="button" onClick={() => void generateSeo()} disabled={genSeo} className="text-xs px-2 py-1 rounded" style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
                        {genSeo ? 'Generating…' : '✨ Generate SEO with AI'}
                      </button>
                    </div>
                    <FieldInput label={`SEO Title (${(selected.seoTitle ?? '').length}/60)`} value={selected.seoTitle ?? ''} onChange={v => patch('seoTitle', v.slice(0, 60))} />
                    <FieldTextarea label={`SEO Description (${(selected.seoDescription ?? '').length}/155)`} value={selected.seoDescription ?? ''} onChange={v => patch('seoDescription', v.slice(0, 155))} rows={2} />
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--color-text-dim)' }}>Keywords</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {keywords.map((kw, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                            {kw}
                            <button type="button" onClick={() => patch('keywords', JSON.stringify(keywords.filter((_, j) => j !== i)))} className="opacity-60 hover:opacity-100">×</button>
                          </span>
                        ))}
                      </div>
                      <input
                        placeholder="Type keyword + Enter"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            patch('keywords', JSON.stringify([...keywords, e.currentTarget.value.trim()]))
                            e.currentTarget.value = ''
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </Card>
                )}
              </div>
            )}

            {panelTab === 'History' && selected.id && (
              <VersionHistory contentType="blog" contentId={selected.id} onRestore={prev => {
                try { setSelected(s => ({ ...s, ...JSON.parse(prev) as Partial<BlogPost> })); showToast('Restored ✓') }
                catch { showToast('Could not restore') }
              }} />
            )}
          </>
        )}
      </SlidePanel>
    </div>
  )
}
