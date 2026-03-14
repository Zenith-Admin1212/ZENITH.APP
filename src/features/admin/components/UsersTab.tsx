'use client'

import { useState }   from 'react'
import { Search }     from 'lucide-react'
import {
  SectionHeader, StatusBadge, ConfirmDialog,
  ActionButton, AdminInput, LoadingSkeleton, EmptyState, A,
} from './AdminUI'
import type { AdminUserRow } from '../services/adminService'

// ═══════════════════════════════════════════════════════════════
//  UsersTab  — search + actions table
//  All destructive actions route through ConfirmDialog.
// ═══════════════════════════════════════════════════════════════

type ConfirmAction =
  | { type: 'block';        user: AdminUserRow }
  | { type: 'unblock';      user: AdminUserRow }
  | { type: 'resetStreak';  user: AdminUserRow }
  | { type: 'grantPremium'; user: AdminUserRow }
  | { type: 'revokePremium'; user: AdminUserRow }

interface UsersTabProps {
  users:       AdminUserRow[]
  isLoading:   boolean
  userSearch:  string
  setSearch:   (s: string) => void
  onGrant:     (uid: string) => void
  onRevoke:    (uid: string) => void
  onBlock:     (uid: string, reason: string) => void
  onUnblock:   (uid: string) => void
  onReset:     (uid: string) => void
  isActing:    boolean
  premiumOnly?: boolean  // Premium tab passes this to filter
}

export function UsersTab({
  users, isLoading, userSearch, setSearch,
  onGrant, onRevoke, onBlock, onUnblock, onReset,
  isActing, premiumOnly = false,
}: UsersTabProps) {
  const [confirm, setConfirm]     = useState<ConfirmAction | null>(null)
  const [blockReason, setBlockReason] = useState('')

  const displayUsers = premiumOnly ? users.filter(u => u.is_premium) : users

  const handleConfirm = () => {
    if (!confirm) return
    switch (confirm.type) {
      case 'block':         onBlock(confirm.user.id, blockReason || 'Admin action'); break
      case 'unblock':       onUnblock(confirm.user.id); break
      case 'resetStreak':   onReset(confirm.user.id); break
      case 'grantPremium':  onGrant(confirm.user.id); break
      case 'revokePremium': onRevoke(confirm.user.id); break
    }
    setConfirm(null)
    setBlockReason('')
  }

  const CONFIRM_CONFIG: Record<ConfirmAction['type'], { title: string; msg: string; text: string; danger: boolean }> = {
    block:         { title: 'Ban User',          msg: `Block ${confirm?.user.username ?? 'this user'}? They will lose access.`,      text: 'Ban User',     danger: true  },
    unblock:       { title: 'Unban User',        msg: `Restore access for ${confirm?.user.username ?? 'this user'}?`,                text: 'Unban',        danger: false },
    resetStreak:   { title: 'Reset Streak',      msg: `Reset ${confirm?.user.username ?? 'this user'}'s streak to 0? Irreversible.`, text: 'Reset',        danger: true  },
    grantPremium:  { title: 'Grant Premium',     msg: `Grant Premium to ${confirm?.user.username ?? 'this user'}?`,                  text: 'Grant',        danger: false },
    revokePremium: { title: 'Revoke Premium',    msg: `Revoke Premium from ${confirm?.user.username ?? 'this user'}?`,               text: 'Revoke',       danger: true  },
  }

  const cfg = confirm ? CONFIRM_CONFIG[confirm.type] : null

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={premiumOnly ? 'Premium Users' : 'User Management'}
        subtitle={premiumOnly
          ? `${displayUsers.length} premium account${displayUsers.length !== 1 ? 's' : ''}`
          : `${users.length} users loaded`}
      >
        {!premiumOnly && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: A.muted }} />
            <input
              value={userSearch}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search username or email…"
              className="pl-8 pr-3 py-2 rounded-xl text-xs outline-none w-56"
              style={{
                background: A.surface2,
                border:     `1px solid ${A.border}`,
                color:      A.text,
              }}
            />
          </div>
        )}
      </SectionHeader>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : displayUsers.length === 0 ? (
        <EmptyState icon="👥" message={premiumOnly ? 'No premium users yet' : 'No users found'} />
      ) : (
        <div className="overflow-x-auto rounded-xl"
          style={{ border: `1px solid ${A.border}` }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: A.surface2, borderBottom: `1px solid ${A.border}` }}>
                {['User', 'Plan', 'Role', 'Streak', 'XP', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold"
                    style={{ color: A.muted, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    background:  i % 2 === 0 ? A.surface : 'transparent',
                    borderBottom: `1px solid ${A.border}`,
                    opacity:      u.blocked ? 0.55 : 1,
                  }}
                >
                  {/* User */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{u.avatar ?? '👤'}</span>
                      <div>
                        <p className="font-semibold" style={{ color: A.text }}>
                          {u.username ?? '(no username)'}
                        </p>
                        <p style={{ color: A.faint, fontSize: '10px' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-3 py-3">
                    <StatusBadge value={u.is_premium ? 'premium' : 'free'} />
                  </td>

                  {/* Role */}
                  <td className="px-3 py-3">
                    <StatusBadge value={u.role} />
                  </td>

                  {/* Streak */}
                  <td className="px-3 py-3">
                    <span className="font-mono font-bold" style={{ color: '#f97316' }}>
                      🔥 {u.streak}
                    </span>
                  </td>

                  {/* XP */}
                  <td className="px-3 py-3">
                    <span className="font-mono" style={{ color: A.gold }}>
                      ⚡ {u.xp.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <StatusBadge value={u.blocked ? 'blocked' : 'active'} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Premium toggle */}
                      {u.is_premium ? (
                        <ActionButton
                          variant="warn" size="xs"
                          onClick={() => setConfirm({ type: 'revokePremium', user: u })}
                          disabled={isActing}
                        >
                          Revoke ★
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="success" size="xs"
                          onClick={() => setConfirm({ type: 'grantPremium', user: u })}
                          disabled={isActing}
                        >
                          Grant ★
                        </ActionButton>
                      )}

                      {/* Block toggle */}
                      {u.blocked ? (
                        <ActionButton
                          variant="primary" size="xs"
                          onClick={() => setConfirm({ type: 'unblock', user: u })}
                          disabled={isActing}
                        >
                          Unban
                        </ActionButton>
                      ) : u.role !== 'admin' && (
                        <ActionButton
                          variant="danger" size="xs"
                          onClick={() => setConfirm({ type: 'block', user: u })}
                          disabled={isActing}
                        >
                          Ban
                        </ActionButton>
                      )}

                      {/* Reset streak */}
                      <ActionButton
                        variant="warn" size="xs"
                        onClick={() => setConfirm({ type: 'resetStreak', user: u })}
                        disabled={isActing}
                      >
                        🔥 Reset
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Block reason input */}
      {confirm?.type === 'block' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: A.surface2, border: `1px solid ${A.border}` }}>
            <p className="font-bold text-sm" style={{ color: A.text }}>
              Ban {confirm.user.username}?
            </p>
            <AdminInput
              label="Reason for ban"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="Violation reason…"
            />
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: A.surface, border: `1px solid ${A.border}`, color: A.muted }}>
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', border: `1px solid ${A.danger}60`, color: A.danger }}>
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard confirm for other actions */}
      {confirm && confirm.type !== 'block' && cfg && (
        <ConfirmDialog
          title={cfg.title}
          message={cfg.msg}
          confirmText={cfg.text}
          danger={cfg.danger}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
