'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { createUserProfile, insertDefaultHabits } from '@/services/authService'
import {
  DEFAULT_HABITS_MUSLIM,
  DEFAULT_HABITS_OTHER,
} from '@/lib/utils/constants'

// ── Avatar options (50 emojis) ────────────────────────────────────
const AVATARS = [
  '⚡','🔥','💎','👑','🏆','🎯','💪','🧠','🚀','⭐',
  '🌟','💫','✨','🌙','☀️','🌊','🏔️','🦁','🐺','🦅',
  '🐉','⚔️','🛡️','🎭','🎪','🌺','🍀','🌸','🌻','🌹',
  '🎸','🎵','📚','🔬','🎨','📷','⚽','🏀','🎾','🏋️',
  '🧘','🤸','🏄','🤺','🎲','🃏','🎮','🕹️','🎯','🏅',
]

const GOAL_OPTIONS = [
  { id: 'fitness',    label: 'Fitness',      icon: '💪' },
  { id: 'study',      label: 'Study',        icon: '📚' },
  { id: 'discipline', label: 'Discipline',   icon: '🎯' },
  { id: 'spiritual',  label: 'Spiritual',    icon: '🙏' },
  { id: 'career',     label: 'Career',       icon: '🚀' },
  { id: 'health',     label: 'Health',       icon: '❤️' },
]

const AGE_OPTIONS = ['Under 18', '18–24', '25–34', '35–44', '45+']

const RELIGION_OPTIONS = [
  { id: 'muslim', label: 'Muslim', icon: '🌙', desc: 'Includes 5 daily prayers + Islamic habits' },
  { id: 'other',  label: 'Other',  icon: '🙏', desc: 'General wellness & productivity habits' },
  { id: 'custom', label: 'Custom', icon: '⭐', desc: 'Start blank — build your own habit set' },
]

// ── Step indicator ────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 24 : 8, opacity: i <= current ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
          style={{ background: i <= current ? 'var(--color-primary)' : 'var(--color-border)', boxShadow: i === current ? 'var(--glow-sm)' : 'none' }}
        />
      ))}
    </div>
  )
}

// ── Slide animation variants ──────────────────────────────────────
function slideVariants(direction: number) {
  return {
    enter:   { x: direction > 0 ? 60 : -60, opacity: 0 },
    center:  { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit:    { x: direction > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25 } },
  }
}

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [authUsername, setAuthUsername] = useState('')

  // Form values
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('⚡')
  const [religion, setReligion] = useState<'muslim' | 'other' | 'custom'>('other')
  const [age, setAge] = useState('18–24')
  const [goals, setGoals] = useState<string[]>(['discipline'])

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      // Pre-fill name from auth metadata
      const meta = user.user_metadata
      if (meta?.full_name) setName(meta.full_name.split(' ')[0])
      else if (meta?.username) setName(meta.username)
      else if (meta?.name) setName(meta.name)
      setAuthUsername(meta?.username || '')
    })
  }, [router])

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2
    if (step === 3) return goals.length > 0
    return true
  }

  const goNext = () => {
    if (!canNext()) return
    setDirection(1)
    setStep(s => s + 1)
  }

  const goPrev = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const toggleGoal = (id: string) => {
    setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
  }

  const handleFinish = async () => {
    if (!userId || goals.length === 0) return
    setSubmitting(true)
    try {
      // Build habits based on religion choice
      const habitList = religion === 'muslim'
        ? [...DEFAULT_HABITS_MUSLIM]
        : religion === 'other'
          ? [...DEFAULT_HABITS_OTHER]
          : []

      await createUserProfile(userId, {
        username: name.trim(),
        avatar,
        age,
        goals,
        active_theme: 'dark-cyber',
      })

      if (habitList.length > 0) {
        await insertDefaultHabits(userId, religion, habitList as Array<{ name: string; icon: string; category: string }>)
      }

      router.push('/app/today')
    } catch (err) {
      console.error('Onboarding error:', err)
      setSubmitting(false)
    }
  }

  const TOTAL_STEPS = 4

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Top: logo + steps */}
        <div className="flex items-center justify-between mb-8 px-1">
          <Image src="/images/logo.png" alt="ZENITH" width={32} height={32}
            style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }} />
          <StepDots current={step} total={TOTAL_STEPS} />
          <span className="text-xs text-zenith-faint font-mono">{step + 1} / {TOTAL_STEPS}</span>
        </div>

        {/* Step card */}
        <div className="card overflow-hidden" style={{ minHeight: 420, background: 'rgba(8,8,18,0.88)', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants(direction)}
              initial="enter"
              animate="center"
              exit="exit"
              className="h-full"
            >
              {/* ── Step 0: Name ── */}
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-glow mb-1">What's your name?</h2>
                    <p className="text-zenith-muted text-sm">This is how you'll appear on the leaderboard</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display">
                      Display Name
                    </label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter your name" autoFocus maxLength={24}
                      className="input-field text-lg"
                      onKeyDown={e => e.key === 'Enter' && canNext() && goNext()}
                    />
                    <p className="text-xs text-zenith-faint">{name.length}/24</p>
                  </div>
                  {name.trim().length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <span className="text-2xl">{avatar}</span>
                      <div>
                        <p className="font-display font-semibold text-sm">{name}</p>
                        <p className="text-xs text-zenith-faint">Bronze · 0 XP · Day 0</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Step 1: Avatar ── */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-glow mb-1">Pick your avatar</h2>
                    <p className="text-zenith-muted text-sm">Choose an emoji that represents you</p>
                  </div>
                  {/* Selected preview */}
                  <div className="flex justify-center">
                    <motion.div
                      key={avatar}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      style={{ background: 'var(--color-surface-active)', border: '2px solid var(--color-primary)', boxShadow: 'var(--glow-md)' }}
                    >
                      {avatar}
                    </motion.div>
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-10 gap-1.5 max-h-52 overflow-y-auto custom-scroll">
                    {AVATARS.map((emoji) => (
                      <button key={emoji} onClick={() => setAvatar(emoji)}
                        className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all duration-150"
                        style={{
                          background: avatar === emoji ? 'var(--color-surface-active)' : 'var(--color-surface)',
                          border: `1px solid ${avatar === emoji ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          boxShadow: avatar === emoji ? 'var(--glow-sm)' : 'none',
                          transform: avatar === emoji ? 'scale(1.15)' : 'scale(1)',
                        }}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Religion ── */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-glow mb-1">Your habit style</h2>
                    <p className="text-zenith-muted text-sm">This sets your default habits — you can always customize later</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {RELIGION_OPTIONS.map((opt) => (
                      <button key={opt.id} onClick={() => setReligion(opt.id as typeof religion)}
                        className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: religion === opt.id ? 'var(--color-surface-active)' : 'var(--color-surface)',
                          border: `1px solid ${religion === opt.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          boxShadow: religion === opt.id ? 'var(--glow-sm)' : 'none',
                        }}>
                        <span className="text-3xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className="font-display font-semibold text-sm"
                            style={{ color: religion === opt.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-zenith-muted mt-0.5">{opt.desc}</p>
                        </div>
                        {religion === opt.id && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--color-primary)' }}>
                            <Check size={12} color="var(--color-bg)" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Age + Goals ── */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-glow mb-1">Your goals</h2>
                    <p className="text-zenith-muted text-sm">Select everything you want to improve</p>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display block mb-2">
                      Age Group
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {AGE_OPTIONS.map((a) => (
                        <button key={a} onClick={() => setAge(a)}
                          className="px-3 py-1.5 text-sm rounded-lg font-semibold transition-all duration-200"
                          style={{
                            background: age === a ? 'var(--color-surface-active)' : 'var(--color-surface)',
                            border: `1px solid ${age === a ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            color: age === a ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            boxShadow: age === a ? 'var(--glow-sm)' : 'none',
                          }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="text-xs font-semibold tracking-widest text-zenith-muted uppercase font-display block mb-2">
                      Goals <span className="text-zenith-faint normal-case font-normal">(select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {GOAL_OPTIONS.map((g) => {
                        const selected = goals.includes(g.id)
                        return (
                          <button key={g.id} onClick={() => toggleGoal(g.id)}
                            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left"
                            style={{
                              background: selected ? 'var(--color-surface-active)' : 'var(--color-surface)',
                              border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              boxShadow: selected ? 'var(--glow-sm)' : 'none',
                            }}>
                            <span className="text-xl">{g.icon}</span>
                            <span className="text-sm font-semibold"
                              style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                              {g.label}
                            </span>
                            {selected && (
                              <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--color-primary)' }}>
                                <Check size={10} color="var(--color-bg)" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 px-1">
          <button onClick={goPrev} disabled={step === 0}
            className="btn-ghost px-4 py-2.5 disabled:opacity-0 disabled:pointer-events-none flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button onClick={goNext} disabled={!canNext()}
              className="btn-primary px-6 py-2.5 flex items-center gap-2">
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleFinish}
              disabled={submitting || goals.length === 0}
              className="btn-primary px-6 py-2.5 flex items-center gap-2 min-w-32 justify-center">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Setting up...</> : <>Let's Go ⚡</>}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
