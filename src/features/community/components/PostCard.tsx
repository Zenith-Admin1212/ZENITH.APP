'use client'

import { useState, useRef }  from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useUserStore }        from '@/stores/userStore'
import { fetchComments }       from '../services/communityService'
import type { FeedPost }       from '../services/communityService'
import type { PostComment, PostReaction } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  PostCard
//  Renders a community post with reactions, poll, comments.
// ═══════════════════════════════════════════════════════════════

const REACTIONS: { type: PostReaction['type']; emoji: string; label: string }[] = [
  { type: 'heart',      emoji: '❤️',  label: 'Love'   },
  { type: 'fire',       emoji: '🔥',  label: 'Fire'   },
  { type: 'clap',       emoji: '👏',  label: 'Clap'   },
  { type: 'mind_blown', emoji: '🤯',  label: 'Wow'    },
]

interface PostCardProps {
  post:       FeedPost
  onReact:    (postId: string, type: PostReaction['type']) => void
  onVote:     (postId: string, optionIdx: number) => void
  onComment:  (postId: string, text: string) => void
  onDelete:   (postId: string) => void
}

export function PostCard({ post, onReact, onVote, onComment, onDelete }: PostCardProps) {
  const { user }               = useUserStore()
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState<PostComment[]>([])
  const [loadingCmts,  setLoadingCmts]  = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isSelf     = post.user_id === user?.id || post.admin_id === user?.id
  const isPoll     = post.type === 'poll'
  const totalVotes = post.vote_counts.reduce((s, v) => s + v, 0)

  const handleToggleComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) {
      setLoadingCmts(true)
      try {
        const data = await fetchComments(post.id)
        setComments(data)
      } catch { /* silent */ }
      setLoadingCmts(false)
    }
  }

  const handleSendComment = async () => {
    const text = replyText.trim()
    if (!text || submitting) return
    setSubmitting(true)
    onComment(post.id, text)
    // Optimistic comment display
    setComments(prev => [...prev, {
      id:           `opt-${Date.now()}`,
      post_id:      post.id,
      user_id:      user?.id ?? null,
      user_name:    user?.username ?? null,
      text,
      reported:     false,
      report_count: 0,
      deleted:      false,
      created_at:   new Date().toISOString(),
    }])
    setReplyText('')
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: post.pinned
          ? 'linear-gradient(135deg, rgba(var(--color-primary-rgb,0,245,255),0.05), var(--color-surface))'
          : 'var(--color-surface)',
        border: `1px solid ${post.pinned ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
      }}
    >
      {/* Pinned badge */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 px-4 pt-2.5"
          style={{ color: 'var(--color-primary)' }}>
          <span style={{ fontSize: '10px' }}>📌</span>
          <span className="font-display font-bold text-2xs tracking-widest" style={{ fontSize: '9px' }}>
            PINNED
          </span>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'var(--color-surface-active)' }}
        >
          {post.author_avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-none">
            {post.author_username ?? 'ZENITH Team'}
          </p>
          <p className="text-2xs text-zenith-faint mt-0.5">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        {isSelf && (
          <button
            onClick={() => onDelete(post.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity"
            style={{ background: 'var(--color-surface-active)' }}
          >
            <Trash2 size={12} style={{ color: '#f87171' }} />
          </button>
        )}
      </div>

      {/* Post body */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {post.body}
        </p>
      </div>

      {/* Poll UI */}
      {isPoll && post.options && post.options.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {post.options.map((opt, i) => {
            const votes   = post.vote_counts[i] ?? 0
            const pct     = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            const isVoted = post.user_vote_idx === i
            return (
              <button
                key={i}
                onClick={() => post.user_vote_idx === null && onVote(post.id, i)}
                disabled={post.user_vote_idx !== null}
                className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-left overflow-hidden transition-all"
                style={{
                  background: isVoted ? 'rgba(var(--color-primary-rgb,0,245,255),0.12)' : 'var(--color-surface-active)',
                  border:     `1px solid ${isVoted ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                {/* Progress fill */}
                {post.user_vote_idx !== null && (
                  <motion.div
                    className="absolute inset-0 rounded-xl origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: isVoted
                        ? 'rgba(var(--color-primary-rgb,0,245,255),0.15)'
                        : 'rgba(255,255,255,0.04)',
                    }}
                  />
                )}
                <span className="relative z-10 flex-1 text-sm font-medium">{opt}</span>
                {post.user_vote_idx !== null && (
                  <span className="relative z-10 font-mono text-xs font-bold text-glow">{pct}%</span>
                )}
              </button>
            )
          })}
          <p className="text-2xs text-zenith-faint">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Reactions + comment toggle bar */}
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderTop: '1px solid var(--color-border)' }}>
        {/* Reaction buttons */}
        <div className="flex items-center gap-1 flex-1">
          {REACTIONS.map(r => {
            const count   = post.reaction_counts[r.type] ?? 0
            const isOwn   = post.user_reaction === r.type
            return (
              <motion.button
                key={r.type}
                whileTap={{ scale: 0.8 }}
                onClick={() => onReact(post.id, r.type)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                style={{
                  background: isOwn ? 'rgba(var(--color-primary-rgb,0,245,255),0.12)' : 'transparent',
                  border:     `1px solid ${isOwn ? 'var(--color-primary)' : 'transparent'}`,
                  boxShadow:  isOwn ? 'var(--glow-sm)' : 'none',
                }}
              >
                <span style={{ fontSize: '14px' }}>{r.emoji}</span>
                {count > 0 && (
                  <span className="text-2xs font-bold"
                    style={{ color: isOwn ? 'var(--color-primary)' : 'var(--color-text-faint)', fontSize: '10px' }}>
                    {count}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Comment toggle */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all"
          style={{ color: showComments ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
        >
          <MessageSquare size={13} />
          <span className="text-xs font-semibold">{post.comment_count || ''}</span>
          {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}
          >
            <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
              {/* Comment list */}
              {loadingCmts && (
                <div className="text-xs text-zenith-faint py-2 text-center">Loading comments...</div>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'var(--color-surface-active)' }}>
                    👤
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2"
                    style={{ background: 'var(--color-surface-active)' }}>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                      {c.user_name ?? 'User'}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={inputRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                  placeholder="Add a comment…"
                  maxLength={200}
                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    background: 'var(--color-surface-active)',
                    border:     '1px solid var(--color-border)',
                    color:      'var(--color-text)',
                  }}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!replyText.trim() || submitting}
                  className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Send size={13} style={{ color: 'var(--color-bg)' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
