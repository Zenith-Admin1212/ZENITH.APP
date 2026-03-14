'use client'

import { useState }   from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Radio, AlertTriangle, CheckCircle2, ScrollText } from 'lucide-react'
import {
  SectionHeader, ConfirmDialog, ActionButton,
  AdminInput, AdminTextarea, LoadingSkeleton, EmptyState, A,
} from './AdminUI'
import type { BroadcastMessage, MaintenanceStatus, AdminLog } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  BroadcastTab  — compose + history
// ═══════════════════════════════════════════════════════════════

interface BroadcastTabProps {
  history:       BroadcastMessage[]
  isLoading:     boolean
  isSending:     boolean
  onSend:        (args: { title: string; message: string }) => void
}

export function BroadcastTab({ history, isLoading, isSending, onSend }: BroadcastTabProps) {
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)

  const canSend = title.trim().length > 0 && message.trim().length > 0

  const handleSend = () => {
    onSend({ title: title.trim(), message: message.trim() })
    setTitle('')
    setMessage('')
    setConfirm(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Broadcast System"
        subtitle="Send platform-wide announcements to all users"
      />

      {/* Compose */}
      <div className="flex flex-col gap-3 p-5 rounded-xl"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Radio size={14} style={{ color: A.cyan }} />
          <p className="font-bold text-sm" style={{ color: A.text }}>New Broadcast</p>
        </div>

        <AdminInput
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. New challenge available!"
          maxLength={100}
        />

        <AdminTextarea
          label="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your announcement…"
          rows={4}
          maxLength={500}
        />

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: A.faint }}>
            Will be sent to all non-blocked users as an in-app notification.
          </p>
          <ActionButton
            variant="primary"
            onClick={() => setConfirm(true)}
            disabled={!canSend || isSending}
          >
            {isSending ? 'Sending…' : 'Send Broadcast'}
          </ActionButton>
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col gap-3">
        <p className="font-semibold text-xs" style={{ color: A.muted }}>BROADCAST HISTORY</p>
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : history.length === 0 ? (
          <EmptyState icon="📡" message="No broadcasts sent yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(b => (
              <div key={b.id}
                className="flex items-start gap-4 px-4 py-3 rounded-xl"
                style={{ background: A.surface, border: `1px solid ${A.border}` }}>
                <Radio size={14} style={{ color: A.cyan, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: A.text }}>{b.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: A.muted }}>{b.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span style={{ color: A.faint, fontSize: '10px' }}>
                      {formatDistanceToNow(new Date(b.sent_at), { addSuffix: true })}
                    </span>
                    <span style={{ color: A.faint, fontSize: '10px' }}>
                      👥 {b.recipient_count.toLocaleString()} recipients
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Send Broadcast?"
          message={`"${title}" will be sent to all active users as an in-app notification.`}
          confirmText="Send Now"
          danger={false}
          onConfirm={handleSend}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  MaintenanceTab  — toggle maintenance mode
// ═══════════════════════════════════════════════════════════════

interface MaintenanceTabProps {
  status:    MaintenanceStatus | null
  isLoading: boolean
  onToggle:  (args: { enabled: boolean; message?: string }) => void
}

export function MaintenanceTab({ status, isLoading, onToggle }: MaintenanceTabProps) {
  const [customMsg, setCustomMsg] = useState('')
  const [confirm, setConfirm]     = useState<'on' | 'off' | null>(null)
  const isOn = status?.enabled ?? false

  const handleConfirm = () => {
    onToggle({
      enabled: confirm === 'on',
      message: confirm === 'on' && customMsg.trim()
        ? customMsg.trim()
        : undefined,
    })
    setConfirm(null)
    setCustomMsg('')
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Maintenance Mode"
        subtitle="Toggle site-wide maintenance. Users will see a maintenance message."
      />

      {/* Status card */}
      <div className="p-6 rounded-xl flex flex-col items-center gap-4 text-center"
        style={{
          background: isOn ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
          border:     `1px solid ${isOn ? A.danger + '40' : A.success + '40'}`,
        }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: isOn ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            border:     `1px solid ${isOn ? A.danger + '50' : A.success + '50'}`,
          }}>
          {isOn
            ? <AlertTriangle size={28} style={{ color: A.danger }} />
            : <CheckCircle2  size={28} style={{ color: A.success }} />}
        </div>

        <div>
          <p className="font-black text-lg"
            style={{ color: isOn ? A.danger : A.success }}>
            {isOn ? 'MAINTENANCE ACTIVE' : 'SYSTEM ONLINE'}
          </p>
          {isLoading ? (
            <p className="text-xs mt-1" style={{ color: A.muted }}>Loading…</p>
          ) : (
            <>
              {status?.message && (
                <p className="text-sm mt-2 max-w-sm" style={{ color: A.muted }}>
                  "{status.message}"
                </p>
              )}
              {status?.updated_at && (
                <p className="text-xs mt-1" style={{ color: A.faint }}>
                  Last updated {formatDistanceToNow(new Date(status.updated_at), { addSuffix: true })}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3">
          {isOn ? (
            <ActionButton variant="success" onClick={() => setConfirm('off')}>
              ✅ Disable Maintenance
            </ActionButton>
          ) : (
            <ActionButton variant="danger" onClick={() => setConfirm('on')}>
              🔧 Enable Maintenance
            </ActionButton>
          )}
        </div>
      </div>

      {/* Custom message input (shown before enabling) */}
      {confirm === 'on' && (
        <div className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ background: A.surface, border: `1px solid ${A.border}` }}>
          <AdminTextarea
            label="Custom maintenance message (optional)"
            value={customMsg}
            onChange={e => setCustomMsg(e.target.value)}
            placeholder="ZENITH is currently undergoing maintenance. Back soon!"
            rows={3}
          />
          <div className="flex gap-2">
            <ActionButton variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" onClick={handleConfirm}>
              Confirm — Enable Maintenance
            </ActionButton>
          </div>
        </div>
      )}

      {confirm === 'off' && (
        <ConfirmDialog
          title="Disable Maintenance Mode?"
          message="Users will immediately regain access to ZENITH."
          confirmText="Bring Online"
          danger={false}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  LogsTab  — admin action audit trail
// ═══════════════════════════════════════════════════════════════

const ACTION_COLORS: Record<string, string> = {
  grant_premium:    '#f59e0b',
  revoke_premium:   '#f97316',
  ban_user:         '#ef4444',
  unban_user:       '#22c55e',
  delete_post:      '#f87171',
  delete_comment:   '#f87171',
  reset_streak:     '#f97316',
  create_challenge: '#60a5fa',
  disable_challenge:'#f97316',
  broadcast_sent:   '#00f5ff',
  maintenance_on:   '#ef4444',
  maintenance_off:  '#22c55e',
}

interface LogsTabProps {
  logs:      AdminLog[]
  isLoading: boolean
}

export function LogsTab({ logs, isLoading }: LogsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="System Logs"
        subtitle="Admin action audit trail — last 50 actions"
      />

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" message="No admin actions recorded yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl"
          style={{ border: `1px solid ${A.border}` }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: A.surface2, borderBottom: `1px solid ${A.border}` }}>
                {['Time', 'Admin', 'Action', 'Target', 'Notes'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold"
                    style={{ color: A.muted, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const actionColor = ACTION_COLORS[log.action] ?? A.muted
                return (
                  <tr key={log.id}
                    style={{ background: i % 2 === 0 ? A.surface : 'transparent', borderBottom: `1px solid ${A.border}` }}>
                    <td className="px-3 py-2.5" style={{ color: A.faint, whiteSpace: 'nowrap' }}>
                      {format(new Date(log.created_at), 'MMM d HH:mm')}
                    </td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: A.cyan }}>
                      {log.admin_username ?? log.admin_id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold"
                        style={{ color: actionColor, fontSize: '10px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: A.muted }}>
                      {log.target_username ?? log.target_user_id?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: A.faint }}>
                      <span className="line-clamp-1">{log.notes ?? '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
