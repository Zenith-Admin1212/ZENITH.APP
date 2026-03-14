'use client'

import { useState }          from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link                  from 'next/link'
import { ZenithLogo }        from '@/components/ui/ZenithLogo'
import {
  Flame, Zap, Trophy, Brain, Shield, BarChart2,
  Check, ChevronDown, ChevronUp, ArrowRight, Star, Crown
} from 'lucide-react'

const STATS = [
  { value: '5',    label: 'Premium Themes'   },
  { value: '33',   label: 'Achievements'     },
  { value: '8',    label: 'Challenges'       },
  { value: '∞',    label: 'Habit Tracking'   },
]

const BENEFITS = [
  { icon: <Flame size={22} style={{ color: '#f97316' }} />, title: 'Streak Engine',    body: 'Track daily consistency with streak shields. Miss a day? A shield covers you.',          color: '#f97316' },
  { icon: <Zap   size={22} style={{ color: '#f59e0b' }} />, title: 'XP & Levelling',   body: 'Earn XP for every habit, pomodoro, and check-in. Level from Bronze to King.',            color: '#f59e0b' },
  { icon: <Trophy size={22} style={{ color: '#60a5fa' }} />, title: 'Leaderboard',     body: 'Ranked by streak — not vanity metrics. The most consistent user wins.',                  color: '#60a5fa' },
  { icon: <Brain  size={22} style={{ color: '#a855f7' }} />, title: 'Focus Timer',     body: 'Built-in Pomodoro with session history and XP rewards per session.',                     color: '#a855f7' },
  { icon: <BarChart2 size={22} style={{ color: '#22c55e' }} />, title: 'Analytics',    body: 'Discipline score, 30-day heatmap, and trend charts for every tracked metric.',           color: '#22c55e' },
  { icon: <Shield size={22} style={{ color: '#00f5ff' }} />, title: 'Challenges',      body: 'Compete in streak, XP race, perfect-week, and pomodoro sprint challenges.',             color: '#00f5ff' },
]

const THEMES_DATA = [
  { name: 'Dark Cyber',  color: '#00f5ff', tier: 'free',    preview: 'Neon cyan on void black. Default.'   },
  { name: 'Cosmic',      color: '#60a5fa', tier: 'premium', preview: 'Glassmorphism. Soft floating cards.' },
  { name: 'Inferno',     color: '#f97316', tier: 'premium', preview: 'Molten orange. Aggressive energy.'   },
  { name: 'Tactician',   color: '#22d3ee', tier: 'premium', preview: 'Tactical teal. Radar HUD aesthetic.' },
  { name: 'Gold Luxe',   color: '#f59e0b', tier: 'premium', preview: 'Luxury gold. Smooth and refined.'    },
]

const FREE_FEATURES   = ['Dark Cyber theme', '7 habits', 'Streak tracking', 'Pomodoro timer', 'Basic analytics', '4 challenges', 'Leaderboard', 'Community']
const PREMIUM_PERKS   = ['All 5 themes', 'Unlimited habits', 'Analytics export', 'All 8 challenges', 'AI weekly reports', 'Premium badge', 'Priority support', 'Early access']

const FAQS = [
  { q: 'How does the streak system work?',      a: 'Complete at least one habit per day to maintain your streak. Each month you get 2 streak shields — use one to absorb a missed day without breaking your streak.' },
  { q: 'What does the Discipline Score measure?', a: 'A weighted score (0–100) combining habit completion (40%), focus sessions (20%), wellness check-ins (20%), and streak consistency (20%).' },
  { q: 'Is this available on mobile?',          a: 'ZENITH is a Progressive Web App — install from your browser on iOS or Android for a native-app experience with offline support.' },
  { q: 'How do I get Premium?',                 a: 'Premium is currently granted by the admin team. Request access via the Feedback section in-app. Payments launching soon.' },
  { q: 'Can I track any type of habit?',        a: 'Yes — name, icon and category are fully customisable. Free accounts track up to 7 habits; Premium removes the limit.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={() => setOpen(o => !o)}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ background: open ? 'rgba(0,245,255,0.06)' : 'rgba(255,255,255,0.03)' }}>
        <p className="font-semibold text-sm pr-4">{q}</p>
        {open
          ? <ChevronUp   size={16} style={{ color: '#00f5ff', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <p className="px-5 pb-4 pt-3 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" data-theme="dark-cyber"
      style={{ background: '#04040a', color: '#f0f4ff' }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,245,255,0.07) 0%, transparent 65%)' }} />
      <div className="fixed inset-0 bg-grid opacity-[0.08] pointer-events-none" />

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(4,4,10,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
        <ZenithLogo variant="full" size="sm" priority />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Sign in
          </Link>
          <Link href="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold font-display tracking-wide"
            style={{ background: '#00f5ff', color: '#04040a', boxShadow: '0 0 16px rgba(0,245,255,0.4)' }}>
            Get Started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="flex flex-col items-center text-center px-5 pt-20 pb-16 gap-8 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-7">
            <ZenithLogo variant="stacked" size="2xl" priority />
            <div className="flex flex-col gap-4">
              <h1 className="font-display font-black text-4xl sm:text-5xl leading-[0.95] tracking-tight"
                style={{ textShadow: '0 0 40px rgba(0,245,255,0.3)' }}>
                ELITE PERFORMANCE<br />
                <span style={{ color: '#00f5ff' }}>SYSTEM</span>
              </h1>
              <p className="text-base sm:text-lg max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Gamified habit tracking built for people who take discipline seriously.
                Streaks. XP. Leaderboards. Challenges.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link href="/login"
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-display font-black text-sm tracking-widest"
                style={{ background: '#00f5ff', color: '#04040a', boxShadow: '0 0 30px rgba(0,245,255,0.45)' }}>
                START FOR FREE <ArrowRight size={15} />
              </Link>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Free to start · No credit card required · Install as PWA
            </p>
          </motion.div>
        </section>

        {/* ── STATS ── */}
        <section className="px-5 pb-12 max-w-2xl mx-auto">
          <div className="grid grid-cols-4 gap-2">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="font-display font-black text-2xl"
                  style={{ color: '#00f5ff', textShadow: '0 0 16px rgba(0,245,255,0.5)' }}>{s.value}</span>
                <span className="text-center leading-snug" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
                  {s.label.toUpperCase()}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── BENEFITS ── */}
        <section className="px-5 py-12 max-w-2xl mx-auto flex flex-col gap-7">
          <div>
            <p className="font-display font-bold text-xs tracking-widest mb-1" style={{ color: '#00f5ff' }}>WHAT YOU GET</p>
            <h2 className="font-display font-black text-2xl" style={{ textShadow: '0 0 20px rgba(0,245,255,0.25)' }}>Every tool for discipline</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex flex-col gap-3 p-5 rounded-2xl"
                style={{ background: `${b.color}08`, border: `1px solid ${b.color}20` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${b.color}15`, border: `1px solid ${b.color}30` }}>
                  {b.icon}
                </div>
                <div>
                  <p className="font-display font-black text-sm mb-1">{b.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{b.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── THEMES ── */}
        <section className="px-5 py-12 max-w-2xl mx-auto flex flex-col gap-6">
          <div>
            <p className="font-display font-bold text-xs tracking-widest mb-1" style={{ color: '#00f5ff' }}>5 THEMES</p>
            <h2 className="font-display font-black text-2xl" style={{ textShadow: '0 0 20px rgba(0,245,255,0.2)' }}>Your aesthetic, your rules</h2>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>One free. Four premium. Each visually distinct.</p>
          </div>
          <div className="flex flex-col gap-2">
            {THEMES_DATA.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ background: t.color, boxShadow: `0 0 14px ${t.color}60` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-black text-sm">{t.name}</p>
                    {t.tier === 'premium' && <Crown size={11} style={{ color: '#f59e0b' }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.preview}</p>
                </div>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: '9px',
                    background: t.tier === 'free' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                    color:      t.tier === 'free' ? '#22c55e'               : '#f59e0b',
                    border:     `1px solid ${t.tier === 'free' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                  {t.tier === 'free' ? 'FREE' : 'PREMIUM'}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PREMIUM COMPARISON ── */}
        <section className="px-5 py-12 max-w-2xl mx-auto flex flex-col gap-6">
          <div>
            <p className="font-display font-bold text-xs tracking-widest mb-1" style={{ color: '#f59e0b' }}>PREMIUM</p>
            <h2 className="font-display font-black text-2xl" style={{ color: '#fde68a', textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>Go all-in</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="font-display font-bold text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>FREE</p>
              <div className="flex flex-col gap-2">
                {FREE_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-2xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(4,4,10,0.8))', border: '1px solid rgba(245,158,11,0.4)', boxShadow: '0 0 30px rgba(245,158,11,0.08)' }}>
              <motion.div className="absolute inset-0 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.1), transparent)', width: '40%' }} />
              <div className="flex items-center gap-1.5">
                <Crown size={14} style={{ color: '#f59e0b' }} />
                <p className="font-display font-bold text-sm" style={{ color: '#f59e0b' }}>PREMIUM</p>
              </div>
              <div className="flex flex-col gap-2">
                {PREMIUM_PERKS.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Star size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: '#fde68a' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="text-sm font-bold">Getting Premium</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Premium is currently granted by the admin team. Sign up, then request access
                via the in-app feedback section. Payments launching soon.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-5 py-12 max-w-2xl mx-auto flex flex-col gap-6">
          <div>
            <p className="font-display font-bold text-xs tracking-widest mb-1" style={{ color: '#00f5ff' }}>FAQ</p>
            <h2 className="font-display font-black text-2xl" style={{ textShadow: '0 0 20px rgba(0,245,255,0.2)' }}>Common questions</h2>
          </div>
          <div className="flex flex-col gap-2">
            {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="px-5 py-16 flex flex-col items-center gap-6 text-center"
          style={{ borderTop: '1px solid rgba(0,245,255,0.08)' }}>
          <ZenithLogo variant="stacked" size="lg" />
          <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            The serious habit tracker for serious people.
          </p>
          <Link href="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-black text-sm tracking-widest"
            style={{ background: '#00f5ff', color: '#04040a', boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}>
            START FREE NOW <ArrowRight size={15} />
          </Link>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} ZENITH · Elite Performance System
          </p>
        </section>

      </main>
    </div>
  )
}
