'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUIStore }          from '@/stores/uiStore'
import { useNotifications }    from '@/features/notifications/hooks/useNotifications'
import type { NotificationType } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  NotificationPanel  (Phase 9 — real data version)
//  Replaces Phase 3 placeholder with live DB + Realtime inbox.
// ═══════════════════════════════════════════════════════════════

const NOTIF_ICONS: Record<NotificationType, string> = {
  streak_milestone: '🔥',
  level_up:         '⬆️',
  achievement:      '🏆',
  challenge_update: '🎯',
  weekly_report:    '📊',
  premium_expiring: '👑',
  admin_message:    '📣',
  broadcast:        '📢',
  habit_reminder:   '⏰',
  reaction:         '❤️',
  comment:          '💬',
  leaderboard:      '🏅',
  challenge_invite: '🤝',
}

export function NotificationPanel() {
  const { notificationPanelOpen, closeNotificationPanel } = useUIStore()
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotif } =
    useNotifications()

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeNotificationPanel}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col safe-top safe-bottom"
            style={{
              background: 'var(--color-bg-secondary)',
              borderLeft: '1px solid var(--color-border)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-display font-bold text-sm tracking-wider">NOTIFICATIONS</h2>
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.7 }} animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-bg)', fontSize: '9px' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    title="Mark all as read"
                    className="transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={closeNotificationPanel}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              {isLoading ? (
                <div className="flex flex-col gap-0 divide-y"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-4 animate-pulse">
                      <div className="w-9 h-9 rounded-xl flex-shrink-0"
                        style={{ background: 'var(--color-surface-active)' }} />
                      <div className="flex-1 flex flex-col gap-2 pt-1">
                        <div className="h-3 w-32 rounded" style={{ background: 'var(--color-surface-active)' }} />
                        <div className="h-2 w-48 rounded" style={{ background: 'var(--color-surface-active)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-5 text-center">
                  <Bell size={32} style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-zenith-faint text-sm">No notifications yet</p>
                  <p className="text-xs text-zenith-faint">
                    You'll be notified about reactions, comments, leaderboard changes and more.
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  <AnimatePresence initial={false}>
                    {notifications.map((notif, i) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors relative"
                        style={{
                          background: notif.read ? 'transparent' : 'var(--color-surface)',
                        }}
                        onClick={() => !notif.read && markRead(notif.id)}
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: 'var(--color-surface-active)' }}
                        >
                          {NOTIF_ICONS[notif.type] ?? '🔔'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug">{notif.title}</p>
                          <p className="text-xs text-zenith-muted mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-2xs text-zenith-faint mt-1.5">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-1.5">
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-sm)' }} />
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteNotif(notif.id) }}
                            className="opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{ color: '#f87171' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
