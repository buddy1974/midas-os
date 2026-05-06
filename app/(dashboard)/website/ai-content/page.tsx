'use client'

import { useState } from 'react'
import { Wand2, RefreshCw } from 'lucide-react'

const DESTINATIONS = [
  { value: 'homepage_hero', label: 'Homepage hero text' },
  { value: 'property_listing', label: 'Property listing (new)' },
  { value: 'blog_post', label: 'Blog post (new draft)' },
  { value: 'event_description', label: 'Event description (new)' },
  { value: 'team_bio', label: 'Team member bio' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'sell_page', label: 'Sell page content' },
  { value: 'about_page', label: 'About page content' },
]

const EXAMPLES: Record<string, string> = {
  property: `3-bed terraced house in Harrow, North London.
Guide price: £320,000. ARV: £420,000.
Needs full refurb — kitchen, bathroom, rewire.
Corner plot, off-street parking.
Close to Harrow-on-the-Hill station (Metropolitan line).
Freehold. Legal pack available.`,

  event: `Midas Pre-Auction Investor Briefing
Date: 15th June 2026, 6pm-8pm
Location: Central London (TBC on registration)
Free to attend
Topics: how auction buying works, due diligence tips, finance options
Q&A session included
Max 40 attendees`,

  bio: `Sam Adjei — Founding Director
Background in property development and investment since 2009.
Grew up in North London, studied at UCL.
Completed 50+ residential and commercial transactions.
Specialises in off-market sourcing and auction strategy.
Passionate about making property investment accessible.`,

  blog: `Topic: Why more investors are choosing auctions over estate agents in 2026.
Key points:
- Speed: 28-day completion vs 3-6 months
- Transparency: open bidding, no gazumping
- Price discovery: guide prices attract serious buyers
- Access: legal packs available before bidding
- Growing trend: auction volumes up 40% since 2022
Target audience: first-time investors and portfolio builders`,
}

export default function AiContentPage() {
  const [rawInput, setRawInput] = useState('')
  const [destination, setDestination] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [saved, setSaved] = useState(false)

  async function generate() {
    if (!rawInput.trim() || !destination) return
    setGenerating(true)
    setResult(null)
    setError('')
    setSaved(false)
    try {
      const r = await fetch('/api/cms/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput, destination }),
      })
      const data = await r.json() as { result?: string; error?: string }
      if (data.result) setResult(data.result)
      else setError(data.error ?? 'Generation failed')
    } catch { setError('Generation failed — please try again') }
    setGenerating(false)
  }

  async function saveResult(publish: boolean) {
    if (!result) return
    setSaving(publish ? 'publish' : 'draft')
    try {
      if (destination === 'blog_post') {
        let parsed: { title?: string; content?: string; excerpt?: string } = {}
        try { parsed = JSON.parse(result) as typeof parsed } catch { parsed = { content: result } }
        await fetch('/api/cms/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsed.title ?? 'Untitled Post',
            slug: (parsed.title ?? 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            content: parsed.content ?? result,
            excerpt: parsed.excerpt ?? '',
            isPublished: publish,
            publishedAt: publish ? new Date().toISOString() : null,
          }),
        })
      } else if (destination === 'property_listing') {
        let parsed: { title?: string; description?: string; keyFeatures?: string[] } = {}
        try { parsed = JSON.parse(result) as typeof parsed } catch { parsed = { description: result } }
        await fetch('/api/lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: parsed.title ?? 'New Property',
            guidePrice: 0,
            description: parsed.description ?? result,
            keyFeatures: JSON.stringify(parsed.keyFeatures ?? []),
            showOnWebsite: publish,
          }),
        })
      } else if (destination === 'team_bio') {
        await fetch('/api/cms/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Team Member', bio: result, showOnWebsite: publish }),
        })
      } else if (destination === 'testimonial') {
        await fetch('/api/cms/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Client', text: result, rating: 5, isActive: publish }),
        })
      } else {
        await fetch('/api/cms/save-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: destination, value: result, label: `AI generated — ${destination}` }),
        })
      }
      setSaved(true)
    } catch { /* silent */ }
    setSaving(null)
  }

  const inputClass = 'w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#C9A84C]'
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>AI Content Generator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
          Paste raw information. Choose a destination. AI formats and publishes it.
        </p>
      </div>

      {/* Step 1 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>1</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Paste your raw information</p>
        </div>
        <textarea
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          rows={10}
          placeholder="Paste anything — property details, event notes, blog ideas, team bio, testimonial text. The more you give, the better the result."
          className={inputClass + ' resize-none'}
          style={inputStyle}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries({ 'Property listing': EXAMPLES.property, 'Event description': EXAMPLES.event, 'Team bio': EXAMPLES.bio, 'Blog article': EXAMPLES.blog }).map(([label, example]) => (
            <button key={label} type="button" onClick={() => setRawInput(example)} className="text-xs px-2 py-1 rounded transition-colors" style={{ color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>2</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Choose destination</p>
        </div>
        <select value={destination} onChange={e => setDestination(e.target.value)} className={inputClass} style={inputStyle}>
          <option value="">— Select where to send the content —</option>
          {DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Step 3 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>3</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Generate</p>
        </div>
        <button
          type="button"
          disabled={generating || !rawInput.trim() || !destination}
          onClick={() => void generate()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          <Wand2 size={16} />
          {generating ? 'ARIA is writing your content…' : '✨ Generate with AI →'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#C9A84C' }}>Generated Result</p>
          <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)', fontFamily: 'inherit' }}>
            {result}
          </pre>

          {saved ? (
            <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Saved ✓</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" disabled={saving !== null} onClick={() => void saveResult(false)} className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
              </button>
              <button type="button" disabled={saving !== null} onClick={() => void saveResult(true)} className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50" style={{ backgroundColor: '#C9A84C', color: '#080809' }}>
                {saving === 'publish' ? 'Publishing…' : 'Publish Now'}
              </button>
              <button type="button" disabled={generating} onClick={() => void generate()} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-opacity disabled:opacity-50" style={{ border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}>
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}
