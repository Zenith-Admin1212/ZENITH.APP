'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, RefreshCw, Wifi } from 'lucide-react'
import { useCommunityFeed } from '../hooks/useCommunityFeed'
import { PostCard }         from './PostCard'
import { CreatePostModal }  from './CreatePostModal'
import type { PostReaction } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  CommunityFeed — the main community page component
// ═══════════════════════════════════════════════════════════════

export function CommunityFeed() {
  const {
    posts, isLoading, isError, refetch,
    createPost, react, comment, vote, deletePost, isPosting,
  } = useCommunityFeed()

  const [showCompose, setShowCompose] = useState(false)

  return (
    <div className="flex flex-col pb-10 max-w-lg mx-auto gap-4 px-4 py-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={17} style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display font-black text-base tracking-widest text-glow">
            COMMUNITY
          </h1>
          {/* Realtime live dot */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: '#22c55e' }}
            />
            <span className="text-2xs font-bold" style={{ color: '#22c55e', fontSize: '9px' }}>
              LIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <RefreshCw size={13} style={{ color: 'var(--color-text-faint)' }} />
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display font-bold text-xs tracking-wide transition-all"
            style={{
              background: 'var(--color-primary)',
              color:      'var(--color-bg)',
              boxShadow:  'var(--glow-sm)',
            }}
          >
            <Plus size={13} /> Post
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      {isError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span>⚠️</span>
          <p className="text-sm" style={{ color: '#fca5a5' }}>
            Couldn't load the feed. Check your connection.
          </p>
        </div>
      )}

      {/* ── Feed ── */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 animate-pulse flex flex-col gap-3"
            style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl" style={{ background: 'var(--color-surface-active)' }} />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 rounded" style={{ background: 'var(--color-surface-active)' }} />
                <div className="h-2 w-16 rounded" style={{ background: 'var(--color-surface-active)' }} />
              </div>
            </div>
            <div className="h-3 w-full rounded"  style={{ background: 'var(--color-surface-active)' }} />
            <div className="h-3 w-4/5 rounded"   style={{ background: 'var(--color-surface-active)' }} />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center"
          style={{ border: '1px dashed var(--color-border)', borderRadius: '1rem' }}>
          <Users size={36} style={{ color: 'var(--color-text-faint)' }} />
          <div>
            <p className="font-display font-bold text-sm text-glow">No posts yet</p>
            <p className="text-xs text-zenith-faint mt-1">Be the first to post in the community!</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Write first post
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onReact={(postId, type) => react({ postId, type: type as PostReaction['type'] })}
              onVote={(postId, optionIdx) => vote({ postId, optionIdx })}
              onComment={(postId, text) => comment({ postId, text })}
              onDelete={deletePost}
            />
          ))}
        </div>
      )}

      {/* ── Compose modal ── */}
      <AnimatePresence>
        {showCompose && (
          <CreatePostModal
            onClose={() => setShowCompose(false)}
            onCreate={(body, type, options) => {
              createPost({ body, type, options })
              setShowCompose(false)
            }}
            isPosting={isPosting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
