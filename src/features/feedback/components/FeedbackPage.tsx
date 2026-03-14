'use client'

import { useState }  from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Check, Loader2, Bug, Lightbulb, MessageCircle } from 'lucide-react'
import { useUserStore }   from '@/stores/userStore'
import { submitFeedback, type FeedbackType } from '../services/feedbackService'

// ═══════════════════════════════════════════════════════════════
//  FeedbackPage  — /app/feedback
//  Simple form → inserts to feedback table → reviewed by admin
// ═══════════════════════════════════════════════════════════════

const TYPES: Array<{
  id:    FeedbackType
  icon:  React.ReactNode
  label: string
  sub:   string
  color: string
}> = [
  {
    id:    'bug',
    icon:  <Bug size={18} />,
    label: 'Bug Report',
    sub:   'Something is broken or behaving unexpectedly',
    color: '#ef4444',
  },
  {
    id:    'feature',
    icon:  <Lightbulb size={18} />,
    label: 'Feature Request',
    sub:   'An idea for something new or improved',
    color: '#f59e0b',
  },
  {
    id:    'general',
    icon:  <MessageCircle size={18} />,
    label: 'General Feedback',
    sub:   'Thoughts, questions, or anything else',
    color: '#60a5fa',
  },
]

export function FeedbackPage() {
  const { user } = useUserStore()

  const [type,      setType]      = useState<FeedbackType>('general')
  const [message,   setMessage]   = useState('')
  const [status,    setStatus]    = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  const canSubmit = message.trim().length >= 10 && status === 'idle'

  const handleSubmit = async () => {
    if (!user || !canSubmit) return
    setStatus('submitting')
    try {
      await submitFeedback(user.id, type, message)
      setStatus('success')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Try again.')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="flex flex-col pb-10 max-w-lg mx-auto px-4 py-4 gap-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
        <h1 className="font-display font-black text-base tracking-widest text-glow">
          FEEDBACK
        </h1>
      </div>

      {/* Success state */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12 px-6 rounded-2xl text-center"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border:     '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <Check size={24} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <p className="font-display font-black text-lg text-glow">Received!</p>
              <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Thanks for the feedback. Our team reviews every submission.
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-xs font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              Submit another
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== 'success' && (
        <>
          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-display font-bold tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>
              TYPE
            </p>
            <div className="flex flex-col gap-2">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                  style={{
                    background: type === t.id ? `${t.color}10` : 'var(--color-surface)',
                    border:     `1px solid ${type === t.id ? t.color + '50' : 'var(--color-border)'}`,
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${t.color}15`,
                      color:      t.color,
                      border:     `1px solid ${t.color}30`,
                    }}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold"
                      style={{ color: type === t.id ? t.color : 'var(--color-text)' }}>
                      {t.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {t.sub}
                    </p>
                  </div>
                  {type === t.id && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: t.color }}>
                      <Check size={10} style={{ color: '#000' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-display font-bold tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>
                MESSAGE
              </p>
              <span className="text-xs" style={{ color: message.length < 10 ? '#f87171' : 'var(--color-text-faint)' }}>
                {message.length}/1000
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 1000))}
              placeholder={
                type === 'bug'
                  ? 'Describe what happened, what you expected, and how to reproduce it…'
                  : type === 'feature'
                    ? 'Describe the feature you\'d like to see and why it would be useful…'
                    : 'Share your thoughts, questions, or anything on your mind…'
              }
              rows={6}
              className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none leading-relaxed"
              style={{
                background: 'var(--color-surface)',
                border:     `1px solid ${message.length >= 10 ? 'var(--color-border-glow)' : 'var(--color-border)'}`,
                color:      'var(--color-text)',
              }}
            />
            {message.length < 10 && message.length > 0 && (
              <p className="text-xs" style={{ color: '#f87171' }}>
                Minimum 10 characters required
              </p>
            )}
          </div>

          {/* Error */}
          {status === 'error' && (
            <p className="text-xs text-center font-semibold" style={{ color: '#f87171' }}>
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl font-display font-black text-sm tracking-wider transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: canSubmit ? 'var(--color-primary)' : 'var(--color-surface)',
              color:      canSubmit ? 'var(--color-bg)' : 'var(--color-text-faint)',
              boxShadow:  canSubmit ? 'var(--glow-sm)' : 'none',
              border:     canSubmit ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {status === 'submitting'
              ? <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Sending…
                </span>
              : 'Send Feedback'
            }
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
            Our team reads every submission. Serious bugs get fastest response.
          </p>
        </>
      )}
    </div>
  )
}
