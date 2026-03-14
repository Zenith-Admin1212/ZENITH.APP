'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, BarChart2, Send } from 'lucide-react'
import type { PostType } from '@/types'

// ═══════════════════════════════════════════════════════════════
//  CreatePostModal — compose a regular post or a poll
// ═══════════════════════════════════════════════════════════════

interface CreatePostModalProps {
  onClose:  () => void
  onCreate: (body: string, type: PostType, options?: string[]) => void
  isPosting: boolean
}

export function CreatePostModal({ onClose, onCreate, isPosting }: CreatePostModalProps) {
  const [type, setType]     = useState<PostType>('post')
  const [body, setBody]     = useState('')
  const [options, setOptions] = useState(['', ''])

  const isPoll    = type === 'poll'
  const canSubmit = body.trim().length >= 3 &&
    (!isPoll || options.filter(o => o.trim()).length >= 2)

  const handleSubmit = () => {
    if (!canSubmit || isPosting) return
    onCreate(
      body,
      type,
      isPoll ? options.filter(o => o.trim()) : []
    )
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl flex flex-col max-h-[90vh]"
        style={{
          background: 'var(--color-bg-secondary)',
          border:     '1px solid var(--color-border-glow)',
        }}
      >
        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-2 px-4">
          <div className="w-10 h-1 rounded-full mb-3"
            style={{ background: 'var(--color-border)' }} />
          <div className="flex items-center justify-between w-full">
            <h3 className="font-display font-black text-sm tracking-wider text-glow">
              NEW POST
            </h3>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-surface)' }}>
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { id: 'post' as PostType, label: '✍️ Post' },
            { id: 'poll' as PostType, label: '📊 Poll' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold font-display transition-all"
              style={{
                background: type === t.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
                border:     `1px solid ${type === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color:      type === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll px-4 pb-4 flex flex-col gap-3">
          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={isPoll ? 'Ask your question…' : 'What\'s on your mind?'}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-text)',
            }}
          />
          <p className="text-2xs text-zenith-faint text-right">{body.length}/500</p>

          {/* Poll options */}
          {isPoll && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-display font-bold tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>
                OPTIONS
              </p>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--color-surface)',
                      border:     '1px solid var(--color-border)',
                      color:      'var(--color-text)',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      <Trash2 size={13} style={{ color: '#f87171' }} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button
                  onClick={() => setOptions(prev => [...prev, ''])}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
                >
                  <Plus size={12} /> Add option
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPosting}
            className="btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            <Send size={14} />
            {isPosting ? 'Posting…' : 'Post to Community'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
