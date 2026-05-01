'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserPlus, RotateCcw, Trash2, ChevronDown, X, Copy, Check } from 'lucide-react'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSIONS } from '@/lib/permissions'
import type { Role } from '@/lib/permissions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamUser {
  id: string
  name: string
  email: string
  role: string
  lastLogin: string | null
  createdBy: string | null
  isActive: boolean
  createdAt: string
}

interface NewUserCredentials {
  name: string
  email: string
  tempPassword: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  admin:     { label: 'Admin',     bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C' },
  manager:   { label: 'Manager',   bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  member:    { label: 'Member',    bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
  view_only: { label: 'View Only', bg: 'rgba(107,114,128,0.2)',  color: '#9CA3AF' },
}

function RoleBadge({ role }: { role: string }) {
  const b = ROLE_BADGE[role] ?? ROLE_BADGE.member
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
      style={{ backgroundColor: b.bg, color: b.color }}
    >
      {b.label}
    </span>
  )
}

function fmtDate(d: string | null) {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROLES: Role[] = ['admin', 'manager', 'member', 'view_only']

const MODULE_ROWS: { key: keyof typeof PERMISSIONS.admin; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pipeline',  label: 'Pipeline' },
  { key: 'contacts',  label: 'CRM / Contacts' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'social',    label: 'Social Content' },
  { key: 'events',    label: 'Events Manager' },
  { key: 'viewings',  label: 'Viewings' },
  { key: 'lenders',   label: 'Lender Portal' },
  { key: 'loans',     label: 'Loan Pipeline' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'market',    label: 'Market Pulse' },
  { key: 'oracle',    label: 'AI Oracle' },
  { key: 'chat',      label: 'ARIA Assistant' },
  { key: 'finance',   label: 'Finance Engine' },
  { key: 'website',   label: 'Website Admin' },
  { key: 'settings',  label: 'Settings' },
  { key: 'users',     label: 'Team & Access' },
]

function permIcon(read: boolean, write: boolean) {
  if (write) return <span style={{ color: '#C9A84C' }}>✓</span>
  if (read)  return <span style={{ color: '#9CA3AF' }}>👁</span>
  return <span style={{ color: 'rgba(232,228,220,0.2)' }}>—</span>
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const selfRole = (session?.user as { role?: string })?.role

  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [matrixOpen, setMatrixOpen] = useState(false)

  // Create form
  const [form, setForm] = useState({ name: '', email: '', role: 'member' as Role })
  const [creating, setCreating] = useState(false)
  const [newCreds, setNewCreds] = useState<NewUserCredentials | null>(null)
  const [copied, setCopied] = useState(false)

  // Temp password reveal
  const [resetResult, setResetResult] = useState<{ name: string; pwd: string } | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json() as { users: TeamUser[] }
        setTeamUsers(data.users)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (selfRole !== 'admin') { router.replace('/'); return }
    void loadUsers()
  }, [status, selfRole, router, loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json() as { user: TeamUser; tempPassword: string }
        setNewCreds({ name: data.user.name, email: data.user.email, tempPassword: data.tempPassword })
        setForm({ name: '', email: '', role: 'member' })
        void loadUsers()
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    void loadUsers()
  }

  async function handleToggleActive(userId: string, current: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    void loadUsers()
  }

  async function handleResetPassword(userId: string) {
    const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { tempPassword: string; name: string }
      setResetResult({ name: data.name, pwd: data.tempPassword })
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from Midas OS? Their account will be deactivated.`)) return
    await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    void loadUsers()
  }

  function copyCredentials(creds: NewUserCredentials) {
    const text = `Midas OS Login\n\nEmail: ${creds.email}\nPassword: ${creds.tempPassword}\nLogin: https://os.midaspropertyauctions.co.uk/login\n\nPlease change your password after first login.`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function whatsappShare(creds: NewUserCredentials) {
    const text = encodeURIComponent(`Hi ${creds.name.split(' ')[0]}, here are your Midas OS login details:\n\nEmail: ${creds.email}\nPassword: ${creds.tempPassword}\nLogin: https://os.midaspropertyauctions.co.uk/login\n\nPlease change your password after first login.`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (status === 'loading' || (status === 'authenticated' && selfRole !== 'admin' && selfRole !== undefined)) {
    return <div className="flex items-center justify-center h-64 text-[rgba(232,228,220,0.4)] text-sm">Loading…</div>
  }

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Team &amp; Access Management</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(232,228,220,0.45)' }}>
            Create accounts, set access levels and manage your team.
          </p>
        </div>
        <button
          onClick={() => { setPanelOpen(true); setNewCreds(null) }}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded transition-colors"
          style={{ backgroundColor: '#C9A84C', color: '#080809' }}
        >
          <UserPlus size={14} />
          Add Team Member
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.15)', backgroundColor: '#0F0F14' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'rgba(232,228,220,0.4)' }}>Loading team…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  {['Name', 'Role', 'Last Login', 'Created By', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'rgba(232,228,220,0.35)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}>

                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(232,228,220,0.4)' }}>{u.email}</p>
                    </td>

                    {/* Role badge + change */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        {(session?.user as { id?: string })?.id !== u.id && (
                          <div className="relative group">
                            <button
                              className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                              style={{ color: 'rgba(232,228,220,0.4)', border: '1px solid rgba(201,168,76,0.15)' }}
                            >
                              Change <ChevronDown size={9} />
                            </button>
                            <div
                              className="absolute left-0 top-full mt-1 z-10 rounded-lg py-1 hidden group-hover:block min-w-[140px]"
                              style={{ backgroundColor: '#0D0D14', border: '1px solid rgba(201,168,76,0.2)' }}
                            >
                              {ROLES.map(r => (
                                <button
                                  key={r}
                                  onClick={() => {
                                    if (confirm(`Change ${u.name} to ${ROLE_LABELS[r]}?\n\nThis changes what they can see and do in Midas OS.`)) {
                                      void handleRoleChange(u.id, r)
                                    }
                                  }}
                                  className="block w-full text-left px-3 py-2 text-xs hover:bg-[rgba(201,168,76,0.06)] transition-colors"
                                  style={{ color: r === u.role ? '#C9A84C' : 'rgba(232,228,220,0.7)' }}
                                >
                                  {ROLE_LABELS[r]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(232,228,220,0.5)' }}>
                      {fmtDate(u.lastLogin)}
                    </td>

                    {/* Created by */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(232,228,220,0.4)' }}>
                      {u.createdBy ?? '—'}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      {(session?.user as { id?: string })?.id !== u.id ? (
                        <button
                          onClick={() => void handleToggleActive(u.id, u.isActive)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                          style={{
                            backgroundColor: u.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: u.isActive ? '#4ADE80' : '#F87171',
                            border: `1px solid ${u.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </button>
                      ) : (
                        <span className="text-[10px]" style={{ color: '#4ADE80' }}>Active (you)</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleResetPassword(u.id)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors hover:text-[#C9A84C]"
                          style={{ color: 'rgba(232,228,220,0.4)', border: '1px solid rgba(201,168,76,0.12)' }}
                          title="Reset password"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                        {(session?.user as { id?: string })?.id !== u.id && (
                          <button
                            onClick={() => void handleRemove(u.id, u.name)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors hover:text-red-400"
                            style={{ color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.15)' }}
                            title="Remove user"
                          >
                            <Trash2 size={10} /> Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset password result */}
      {resetResult && (
        <div className="rounded-xl p-5" style={{ border: '1px solid rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.06)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C9A84C' }}>
                Temporary Password — {resetResult.name}
              </p>
              <p className="text-white font-mono text-base">{resetResult.pwd}</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(232,228,220,0.45)' }}>
                Send this to {resetResult.name} and ask them to change it on login.
              </p>
            </div>
            <button onClick={() => setResetResult(null)}>
              <X size={14} style={{ color: 'rgba(232,228,220,0.4)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Access matrix toggle */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.12)', backgroundColor: '#0F0F14' }}>
        <button
          onClick={() => setMatrixOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors hover:bg-[rgba(201,168,76,0.04)]"
          style={{ color: '#E8E4DC' }}
        >
          <span>What can each role do?</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${matrixOpen ? 'rotate-180' : ''}`} style={{ color: '#C9A84C' }} />
        </button>

        {matrixOpen && (
          <div className="overflow-x-auto border-t" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'rgba(232,228,220,0.4)' }}>Module</th>
                  {ROLES.map(r => (
                    <th key={r} className="px-4 py-2.5 font-semibold text-center" style={{ color: 'rgba(232,228,220,0.4)' }}>
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_ROWS.map(({ key, label }) => (
                  <tr key={key} style={{ borderBottom: '1px solid rgba(201,168,76,0.05)' }}>
                    <td className="px-4 py-2" style={{ color: 'rgba(232,228,220,0.6)' }}>{label}</td>
                    {ROLES.map(r => {
                      const p = PERMISSIONS[r][key]
                      return (
                        <td key={r} className="px-4 py-2 text-center">
                          {permIcon(p.read, p.write)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[10px]" style={{ color: 'rgba(232,228,220,0.25)' }}>
              ✓ Write access · 👁 Read only · — No access
            </p>
          </div>
        )}
      </div>

      {/* Create user slide-in panel */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => { setPanelOpen(false); setNewCreds(null) }}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto"
            style={{ width: '380px', backgroundColor: '#0F0F14', borderLeft: '1px solid rgba(201,168,76,0.2)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <h2 className="text-sm font-bold text-white">Add Team Member</h2>
              <button onClick={() => { setPanelOpen(false); setNewCreds(null) }}>
                <X size={16} style={{ color: 'rgba(232,228,220,0.5)' }} />
              </button>
            </div>

            <div className="px-6 py-6 flex-1">
              {newCreds ? (
                /* Success state — show credentials */
                <div className="space-y-5">
                  <div className="text-center py-4">
                    <div className="text-[#C9A84C] text-3xl mb-2">✓</div>
                    <p className="text-white font-bold">Account created</p>
                  </div>

                  <div className="rounded-xl p-5 space-y-3" style={{ border: '1px solid rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.06)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>Share these credentials</p>
                    {[
                      { label: 'Name', value: newCreds.name },
                      { label: 'Email', value: newCreds.email },
                      { label: 'Password', value: newCreds.tempPassword },
                      { label: 'Login URL', value: 'os.midaspropertyauctions.co.uk/login' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(232,228,220,0.35)' }}>{label}</p>
                        <p className="text-white text-xs font-mono">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => copyCredentials(newCreds)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded text-sm font-semibold transition-colors"
                      style={{ backgroundColor: '#C9A84C', color: '#080809' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy Credentials'}
                    </button>
                    <button
                      onClick={() => whatsappShare(newCreds)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded text-sm font-semibold transition-colors"
                      style={{ border: '1px solid rgba(34,197,94,0.4)', color: '#4ADE80' }}
                    >
                      Send by WhatsApp
                    </button>
                    <button
                      onClick={() => setNewCreds(null)}
                      className="w-full py-3 rounded text-sm transition-colors"
                      style={{ color: 'rgba(232,228,220,0.5)', border: '1px solid rgba(201,168,76,0.15)' }}
                    >
                      Add Another
                    </button>
                  </div>
                </div>
              ) : (
                /* Create form */
                <form onSubmit={handleCreate} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(232,228,220,0.45)' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Sara Williams"
                      className="w-full px-3 py-2.5 rounded text-sm text-white outline-none focus:ring-1 focus:ring-[#C9A84C]"
                      style={{ backgroundColor: '#15151C', border: '1px solid rgba(201,168,76,0.2)' }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(232,228,220,0.45)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="sara@midaspropertyauctions.co.uk"
                      className="w-full px-3 py-2.5 rounded text-sm text-white outline-none focus:ring-1 focus:ring-[#C9A84C]"
                      style={{ backgroundColor: '#15151C', border: '1px solid rgba(201,168,76,0.2)' }}
                    />
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(232,228,220,0.45)' }}>
                      Access Level
                    </label>
                    <div className="space-y-2">
                      {ROLES.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, role: r }))}
                          className="w-full text-left px-3 py-3 rounded transition-all"
                          style={{
                            backgroundColor: form.role === r ? 'rgba(201,168,76,0.1)' : '#15151C',
                            border: `1px solid ${form.role === r ? '#C9A84C' : 'rgba(201,168,76,0.15)'}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <RoleBadge role={r} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'rgba(232,228,220,0.5)' }}>
                            {ROLE_DESCRIPTIONS[r]}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 rounded text-sm font-bold uppercase tracking-wider transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: '#C9A84C', color: '#080809' }}
                  >
                    {creating ? 'Creating…' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
