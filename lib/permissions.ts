export type Role = 'admin' | 'manager' | 'member' | 'view_only'

export interface Permission {
  read: boolean
  write: boolean
  delete: boolean
}

export interface ModulePermissions {
  dashboard: Permission
  pipeline: Permission
  contacts: Permission
  campaigns: Permission
  newsletter: Permission
  social: Permission
  events: Permission
  viewings: Permission
  lenders: Permission
  loans: Permission
  portfolio: Permission
  market: Permission
  oracle: Permission
  chat: Permission
  finance: Permission
  website: Permission
  settings: Permission
  users: Permission
}

const full: Permission = { read: true, write: true, delete: true }
const rw: Permission = { read: true, write: true, delete: false }
const ro: Permission = { read: true, write: false, delete: false }
const none: Permission = { read: false, write: false, delete: false }

export const PERMISSIONS: Record<Role, ModulePermissions> = {
  admin: {
    dashboard: full, pipeline: full, contacts: full, campaigns: full,
    newsletter: full, social: full, events: full, viewings: full,
    lenders: full, loans: full, portfolio: full, market: full,
    oracle: full, chat: full, finance: full, website: full,
    settings: full, users: full,
  },

  manager: {
    dashboard: rw, pipeline: rw, contacts: rw, campaigns: rw,
    newsletter: rw, social: rw, events: rw, viewings: rw,
    lenders: rw, loans: rw, portfolio: rw, market: ro,
    oracle: rw, chat: rw, finance: ro, website: rw,
    settings: ro, users: none,
  },

  member: {
    dashboard: ro, pipeline: rw, contacts: rw, campaigns: ro,
    newsletter: ro, social: rw, events: rw, viewings: rw,
    lenders: ro, loans: ro, portfolio: ro, market: ro,
    oracle: rw, chat: rw, finance: none, website: ro,
    settings: none, users: none,
  },

  view_only: {
    dashboard: ro, pipeline: ro, contacts: ro, campaigns: ro,
    newsletter: ro, social: ro, events: ro, viewings: ro,
    lenders: ro, loans: none, portfolio: ro, market: ro,
    oracle: none, chat: none, finance: none, website: ro,
    settings: none, users: none,
  },
}

export function can(
  role: Role,
  module: keyof ModulePermissions,
  action: keyof Permission
): boolean {
  return PERMISSIONS[role]?.[module]?.[action] ?? false
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  view_only: 'View Only',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access to all modules. Can create and manage team accounts.',
  manager: 'Can edit and create across all modules. Cannot delete or manage users.',
  member: 'Can view all data and use AI tools. Cannot access finance or settings.',
  view_only: 'Read-only access. Cannot edit anything.',
}
