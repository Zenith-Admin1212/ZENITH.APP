'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }      from 'next/navigation'
import Image              from 'next/image'
import { motion }         from 'framer-motion'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase }       from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
//  /auth/reset-password — password reset form
//  Supabase sends users here after they click the email link.
//  The recovery token is in the URL hash and handled automatically
//  by the Supabase SSR client via the auth/callback route.
// ─────────────────────────────────────────────────────────────

type Stage = 'form' | 'success' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [stage,     setStage]     = useState<Stage>('form')
  const [loading,   setLoading]   = useState(false)
  const [errorMsg,  setErrorMsg]  = useState('')
  const [hasSession, setHasSession] = useState(false)

  // Verify the user arrived here with a valid recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  const validate = useCallback((): string | null => {
    if (password.length < 8)          return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password))      return 'Password must contain at least one uppercase letter'
    if (!/[0-9]/.test(password))      return 'Password must contain at least one number'
    if (password !== confirm)         return 'Passwords do not match'
    return null
  }, [password, confirm])

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setStage('error')
    } else {
      setStage('success')
      setTimeout(() => router.push('/app/today'), 2500)
    }
    setLoading(false)
  }

  const strength = (() => {
    let score = 0
    if (password.length >= 8)        score++
    if (password.length >= 12)       score++
    if (/[A-Z]/.test(password))      score++
    if (/[0-9]/.test(password))      score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength] ?? ''
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#00f5ff'][strength] ?? '#ef4444'

  if (stage === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Password Updated
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Redirecting you to your dashboard…
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.png"
            alt="ZENITH"
            width={52}
            height={52}
            className="rounded-xl"
          />
        </div>

        <h1
          className="font-display text-2xl font-black tracking-widest text-center mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          RESET PASSWORD
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Choose a strong new password for your account.
        </p>

        {!hasSession && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: '#ef4444' }}>
              Invalid or expired reset link. Please request a new one.
            </p>
          </div>
        )}

        {/* Password field */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1 tracking-widest uppercase"
            style={{ color: 'var(--color-text-muted)' }}>
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-faint)' }} />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strength ? strengthColor : 'var(--color-surface-hover)' }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
            </div>
          )}
        </div>

        {/* Confirm field */}
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-1 tracking-widest uppercase"
            style={{ color: 'var(--color-text-muted)' }}>
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-faint)' }} />
            <input
              type={showConf ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : 'var(--color-border)'}`,
                color: 'var(--color-text)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConf(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: '#ef4444' }}>{errorMsg}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !hasSession}
          className="w-full py-3 rounded-xl font-display font-bold tracking-widest text-sm uppercase transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--gradient-primary)',
            color: '#fff',
            boxShadow: loading ? 'none' : 'var(--glow-md)',
          }}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </motion.div>
    </div>
  )
}
