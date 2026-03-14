'use client'

import { useState }  from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  SectionHeader, StatusBadge, ConfirmDialog,
  ActionButton, LoadingSkeleton, EmptyState, A,
} from './AdminUI'

// ═══════════════════════════════════════════════════════════════
//  CommunityTab  — post moderation
// ═══════════════════════════════════════════════════════════════

interface CommunityTabProps {
  posts:      any[]
  isLoading:  boolean
  onDelete:   (postId: string) => void
  onBlockUser:(uid: string, reason: string) => void
}

export function CommunityTab({ posts, isLoading, onDelete, onBlockUser }: CommunityTabProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [blockTarget,  setBlockTarget]  = useState<{ id: string; name: string } | null>(null)

  const active = posts.filter(p => !p.deleted)
  const deleted = posts.filter(p => p.deleted)

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Community Moderation"
        subtitle={`${active.length} active posts · ${deleted.length} deleted`}
      />

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : active.length === 0 ? (
        <EmptyState icon="💬" message="No community posts" />
      ) : (
        <div className="flex flex-col gap-2">
          {active.map(post => {
            const reactionCount = post.post_reactions?.length ?? 0
            const commentCount  = post.post_comments?.filter((c: any) => !c.deleted).length ?? 0
            return (
              <div key={post.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: A.surface, border: `1px solid ${A.border}` }}>
                {/* Avatar + user */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-lg">{post.users?.avatar ?? '👤'}</span>
                  <span className="font-semibold" style={{ color: A.muted, fontSize: '10px' }}>
                    {post.users?.username ?? 'anon'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: A.text }}>
                    {post.body}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span style={{ color: A.faint, fontSize: '10px' }}>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    <span style={{ color: A.faint, fontSize: '10px' }}>❤️ {reactionCount}</span>
                    <span style={{ color: A.faint, fontSize: '10px' }}>💬 {commentCount}</span>
                    <StatusBadge value={post.type ?? 'post'} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <ActionButton
                    variant="warn" size="xs"
                    onClick={() => setBlockTarget({ id: post.user_id, name: post.users?.username ?? 'user' })}
                  >
                    Ban User
                  </ActionButton>
                  <ActionButton
                    variant="danger" size="xs"
                    onClick={() => setDeleteTarget(post.id)}
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Post"
          message="This post will be soft-deleted and hidden from all users."
          confirmText="Delete"
          danger
          onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {blockTarget && (
        <ConfirmDialog
          title={`Ban ${blockTarget.name}?`}
          message="This user will be blocked from accessing ZENITH."
          confirmText="Ban User"
          danger
          onConfirm={() => { onBlockUser(blockTarget.id, 'Community violation'); setBlockTarget(null) }}
          onCancel={() => setBlockTarget(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  ChallengesTab  — enable / disable challenges + participant stats
// ═══════════════════════════════════════════════════════════════

interface ChallengesTabProps {
  challenges:       any[]
  isLoading:        boolean
  onDisable:        (id: string) => void
  onEnable:         (id: string) => void
}

export function ChallengesTab({ challenges, isLoading, onDisable, onEnable }: ChallengesTabProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmType, setConfirmType] = useState<'disable' | 'enable'>('disable')

  const targetChallenge = challenges.find(c => c.id === confirmId)

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Challenge Management"
        subtitle={`${challenges.filter(c => c.active).length} active · ${challenges.filter(c => !c.active).length} disabled`}
      />

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : challenges.length === 0 ? (
        <EmptyState icon="🏆" message="No challenges configured" />
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${A.border}` }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: A.surface2, borderBottom: `1px solid ${A.border}` }}>
                {['Challenge', 'Kind', 'Total', 'Active', 'Completed', 'XP', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold" style={{ color: A.muted, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {challenges.map((c, i) => (
                <tr key={c.id}
                  style={{ background: i % 2 === 0 ? A.surface : 'transparent', borderBottom: `1px solid ${A.border}`, opacity: c.active ? 1 : 0.5 }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.icon}</span>
                      <span className="font-semibold" style={{ color: A.text }}>{c.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge value={c.kind?.replace('_', ' ') ?? 'unknown'} /></td>
                  <td className="px-3 py-3 font-mono" style={{ color: A.cyan }}>{c.total_participants}</td>
                  <td className="px-3 py-3 font-mono" style={{ color: A.success }}>{c.active_participants}</td>
                  <td className="px-3 py-3 font-mono" style={{ color: A.gold }}>{c.completed}</td>
                  <td className="px-3 py-3 font-mono" style={{ color: A.gold }}>⚡ {c.xp_reward}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={c.active ? 'active' : 'blocked'} />
                  </td>
                  <td className="px-3 py-3">
                    {c.active ? (
                      <ActionButton variant="danger" size="xs"
                        onClick={() => { setConfirmId(c.id); setConfirmType('disable') }}>
                        Disable
                      </ActionButton>
                    ) : (
                      <ActionButton variant="success" size="xs"
                        onClick={() => { setConfirmId(c.id); setConfirmType('enable') }}>
                        Enable
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && targetChallenge && (
        <ConfirmDialog
          title={confirmType === 'disable' ? 'Disable Challenge' : 'Enable Challenge'}
          message={confirmType === 'disable'
            ? `"${targetChallenge.title}" will be hidden from all users. Active participants will remain but no new enrollments.`
            : `"${targetChallenge.title}" will become visible and joinable again.`}
          confirmText={confirmType === 'disable' ? 'Disable' : 'Enable'}
          danger={confirmType === 'disable'}
          onConfirm={() => {
            if (confirmType === 'disable') onDisable(confirmId)
            else onEnable(confirmId)
            setConfirmId(null)
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  FeedbackTab  — review and resolve user feedback
// ═══════════════════════════════════════════════════════════════

import type { FeedbackItem } from '@/types'

interface FeedbackTabProps {
  feedback:   FeedbackItem[]
  isLoading:  boolean
  onUpdate:   (args: { id: string; status: FeedbackItem['status'] }) => void
}

export function FeedbackTab({ feedback, isLoading, onUpdate }: FeedbackTabProps) {
  const [filter, setFilter] = useState<FeedbackItem['status'] | 'all'>('all')

  const displayed = filter === 'all' ? feedback : feedback.filter(f => f.status === filter)
  const counts = {
    open:     feedback.filter(f => f.status === 'open').length,
    reviewed: feedback.filter(f => f.status === 'reviewed').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="User Feedback"
        subtitle={`${counts.open} open · ${counts.reviewed} reviewed · ${counts.resolved} resolved`}
      />

      {/* Filter pills */}
      <div className="flex gap-2">
        {(['all', 'open', 'reviewed', 'resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'rgba(0,245,255,0.12)' : A.surface2,
              border:     `1px solid ${filter === f ? A.cyan + '60' : A.border}`,
              color:      filter === f ? A.cyan : A.muted,
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="ml-1.5 opacity-70">({counts[f as keyof typeof counts]})</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : displayed.length === 0 ? (
        <EmptyState icon="📬" message="No feedback in this category" />
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(item => (
            <div key={item.id}
              className="flex items-start gap-4 px-4 py-3.5 rounded-xl"
              style={{ background: A.surface, border: `1px solid ${A.border}` }}>
              {/* Type + user */}
              <div className="flex flex-col gap-1 flex-shrink-0 w-24">
                <StatusBadge value={item.type} />
                <span style={{ color: A.faint, fontSize: '10px' }}>{item.username ?? 'anon'}</span>
                <span style={{ color: A.faint, fontSize: '10px' }}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Message */}
              <p className="flex-1 text-xs leading-relaxed" style={{ color: A.text }}>
                {item.message}
              </p>

              {/* Status actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <StatusBadge value={item.status} />
                <div className="flex gap-1">
                  {item.status !== 'reviewed' && (
                    <ActionButton variant="primary" size="xs"
                      onClick={() => onUpdate({ id: item.id, status: 'reviewed' })}>
                      Review
                    </ActionButton>
                  )}
                  {item.status !== 'resolved' && (
                    <ActionButton variant="success" size="xs"
                      onClick={() => onUpdate({ id: item.id, status: 'resolved' })}>
                      Resolve
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
