'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, Wrench } from 'lucide-react'
import {
  signIn, signUp, signInWithGoogle, sendPasswordReset, getUserProfile
} from '@/services/authService'
import { supabase } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'

function ParticleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-8"
        style={{ background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)' }} />
    </div>
  )
}

interface InputProps {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; icon: React.ReactNode; autoComplete?: string
  error?: boolean; suffix?: React.ReactNode
}

function AuthInput({ label, type, value, onChange, placeholder, icon, autoComplete, error, suffix }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zenith-faint">{icon}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className="input-field pl-11 pr-12"
          style={{ borderColor: error ? '#ef4444' : undefined, boxShadow: error ? '0 0 0 1px #ef4444' : undefined }} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [maintenance, setMaintenance] = useState<{ on: boolean; message: string } | null>(null)

  // Check maintenance mode on mount
  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()
      .then(({ data }) => {
        if (data?.value?.enabled) {
          setMaintenance({
            on:      true,
            message: data.value.message ?? 'ZENITH is currently undergoing maintenance. Back soon!',
          })
        }
      })
      .catch(() => { /* ignore — don't block login if settings fetch fails */ })
  }, [])

  const clearMessages = () => { setError(null); setSuccessMsg(null) }

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Something went wrong'
    const cleaned = msg
      .replace('Invalid login credentials', 'Incorrect email or password')
      .replace('User already registered', 'An account with this email already exists')
      .replace('Password should be at least 6 characters', 'Password must be at least 6 characters')
      .replace('Unable to validate email address: invalid format', 'Please enter a valid email address')
    setError(cleaned)
    setShakeKey(k => k + 1)
  }, [])

  const handleSignIn = async () => {
    if (!email || !password) { handleError(new Error('Please fill in all fields')); return }
    clearMessages(); setIsLoading(true)
    try {
      const { user } = await signIn({ email, password })
      if (!user) throw new Error('Sign in failed')
      const profile = await getUserProfile(user.id)
      router.push(profile?.username ? '/app/today' : '/onboard')
    } catch (err) { handleError(err) } finally { setIsLoading(false) }
  }

  const handleSignUp = async () => {
    if (!email || !password || !username) { handleError(new Error('Please fill in all fields')); return }
    if (username.trim().length < 2) { handleError(new Error('Username must be at least 2 characters')); return }
    if (password.length < 6) { handleError(new Error('Password must be at least 6 characters')); return }
    clearMessages(); setIsLoading(true)
    try {
      const { user, session } = await signUp({ email, password, username })
      if (session) { router.push('/onboard') }
      else if (user) { setSuccessMsg('Check your email to confirm your account, then sign in.'); setMode('signin') }
    } catch (err) { handleError(err) } finally { setIsLoading(false) }
  }

  const handleGoogle = async () => {
    clearMessages(); setGoogleLoading(true)
    try { await signInWithGoogle() }
    catch (err) { handleError(err); setGoogleLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { handleError(new Error('Please enter your email address')); return }
    clearMessages(); setIsLoading(true)
    try { await sendPasswordReset(email); setSuccessMsg('Password reset link sent! Check your email.') }
    catch (err) { handleError(err) } finally { setIsLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signin') handleSignIn()
    else if (mode === 'signup') handleSignUp()
    else handleForgot()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <ParticleBackground />

      {/* Maintenance banner */}
      {maintenance?.on && (
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 inset-x-0 z-50 flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(8px)' }}
        >
          <Wrench size={16} className="flex-shrink-0 text-white" />
          <p className="text-white text-sm font-semibold flex-1">{maintenance.message}</p>
        </motion.div>
      )}

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-3 mb-8">
        <Image src="/images/logo.png" alt="ZENITH" width={72} height={72} priority
          className="object-contain"
          style={{ filter: 'drop-shadow(0 0 24px var(--color-primary-glow))' }} />
        <span className="font-display font-black tracking-[0.3em] text-2xl text-glow">ZENITH</span>
        <p className="text-zenith-muted text-sm tracking-wider">
          {mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Elite Performance System'}
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        key={`${mode}-${shakeKey}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={shakeKey > 0
          ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: shakeKey > 0 ? 0.4 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-md"
        style={{ background: 'rgba(8,8,18,0.88)', backdropFilter: 'blur(20px)' }}
      >
        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div className="flex mb-6 rounded-lg p-1" style={{ background: 'var(--color-bg-secondary)' }}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); clearMessages() }}
                className="flex-1 py-2 text-sm font-semibold font-display tracking-wider transition-all duration-200 rounded-md"
                style={{
                  background: mode === m ? 'var(--color-surface-active)' : 'transparent',
                  color: mode === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: mode === m ? 'var(--glow-sm)' : 'none',
                }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-glow">Reset Password</h2>
            <p className="text-zenith-muted text-sm mt-1">Enter your email and we'll send a reset link</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username field */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <AuthInput label="Username" type="text" value={username} onChange={setUsername}
                  placeholder="yourname" icon={<User size={16} />} autoComplete="username" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <AuthInput label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" icon={<Mail size={16} />} autoComplete="email" />

          {/* Password */}
          <AnimatePresence>
            {mode !== 'forgot' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                <AuthInput
                  label="Password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={setPassword}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  icon={<Lock size={16} />}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  suffix={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-zenith-faint hover:text-zenith-muted transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot link */}
          {mode === 'signin' && (
            <button type="button" onClick={() => { setMode('forgot'); clearMessages() }}
              className="text-xs text-zenith-muted hover:text-primary text-right transition-colors -mt-2">
              Forgot password?
            </button>
          )}

          {/* Error / success */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <AlertCircle size={14} className="flex-shrink-0" /> {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                <span>✓</span> {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
              mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
            )}
          </button>

          {mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('signin'); clearMessages() }}
              className="text-sm text-zenith-muted hover:text-primary text-center transition-colors">
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* Google OAuth */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs text-zenith-faint font-mono tracking-widest">OR</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>
            <button type="button" onClick={handleGoogle} disabled={googleLoading}
              className="btn-ghost w-full gap-3 py-3">
              {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </>
        )}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="mt-6 text-xs text-zenith-faint text-center">
        By continuing, you agree to ZENITH's Terms of Service
      </motion.p>
    </main>
  )
}
