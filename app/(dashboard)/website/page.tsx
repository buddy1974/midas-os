'use client'

import { useState } from 'react'
import { ExternalLink, Gavel, Globe, FileText, Users, BookOpen, Star, CalendarDays, Image, Settings, LayoutGrid } from 'lucide-react'
import { WEBSITE_URL } from './_shared'
import AuctionTab from './_tabs/AuctionTab'
import PropertiesTab from './_tabs/PropertiesTab'
import PagesTab from './_tabs/PagesTab'
import ContentTab from './_tabs/ContentTab'
import TeamTab from './_tabs/TeamTab'
import BlogTab from './_tabs/BlogTab'
import TestimonialsTab from './_tabs/TestimonialsTab'
import EventsTab from './_tabs/EventsTab'
import MediaTab from './_tabs/MediaTab'
import SettingsTab from './_tabs/SettingsTab'

type Tab = 'auction' | 'properties' | 'pages' | 'content' | 'team' | 'blog' | 'testimonials' | 'events' | 'media' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'auction',      label: 'Auction',      icon: Gavel },
  { id: 'properties',  label: 'Properties',   icon: Globe },
  { id: 'pages',       label: 'Pages & Nav',  icon: LayoutGrid },
  { id: 'content',     label: 'Content',      icon: FileText },
  { id: 'team',        label: 'Team',         icon: Users },
  { id: 'blog',        label: 'Blog',         icon: BookOpen },
  { id: 'testimonials',label: 'Testimonials', icon: Star },
  { id: 'events',      label: 'Events',       icon: CalendarDays },
  { id: 'media',       label: 'Media',        icon: Image },
  { id: 'settings',    label: 'Settings',     icon: Settings },
]

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState<Tab>('auction')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-5 flex items-start justify-between gap-4 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Website Admin</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
            Manage every part of your website from here. No code needed.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-80"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
          >
            Preview Website <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="px-6 flex gap-0.5 overflow-x-auto shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2"
            style={{
              borderBottomColor: activeTab === id ? '#C9A84C' : 'transparent',
              color: activeTab === id ? '#C9A84C' : 'var(--color-text-dim)',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'auction'      && <AuctionTab />}
        {activeTab === 'properties'   && <PropertiesTab />}
        {activeTab === 'pages'        && <PagesTab />}
        {activeTab === 'content'      && <ContentTab />}
        {activeTab === 'team'         && <TeamTab />}
        {activeTab === 'blog'         && <BlogTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'events'       && <EventsTab />}
        {activeTab === 'media'        && <MediaTab />}
        {activeTab === 'settings'     && <SettingsTab />}
      </div>
    </div>
  )
}
