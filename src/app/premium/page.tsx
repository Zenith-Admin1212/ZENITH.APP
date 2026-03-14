'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, Sparkles, ArrowLeft, Zap, Star, X } from 'lucide-react'
import { PREMIUM_FEATURES, FEATURE_TABLE_ORDER } from '@/features/premium/services/premiumService'
import { PremiumBadge } from '@/features/premium/components/PremiumBadge'
import { PREMIUM_PRICING } from '@/lib/utils/constants'

// ═══════════════════════════════════════════════════════════════
//  /premium — Full standalone Premium upgrade page
//  Spec: Screen 19 — theme previews, comparison table,
//  ₹149/month and ₹1299/year pricing cards.
//  Payment (Razorpay) wired in Phase 12.
// ═══════════════════════════════════════════════════════════════

const THEMES_PREVIEW = [
  { id: 'dark-cyber', name: 'Dark Cyber',  color: '#00f5ff', tier: 'FREE',    bg: 'linear-gradient(135deg,#04040a 0%,#0a0a1a 100%)', glow: 'rgba(0,245,255,0.3)' },
  { id: 'cosmic',     name: 'Cosmic',      color: '#60a5fa', tier: 'PREMIUM', bg: 'linear-gradient(135deg,#030308 0%,#0f0f2e 100%)', glow: 'rgba(96,165,250,0.3)' },
  { id: 'inferno',    name: 'Inferno',     color: '#f97316', tier: 'PREMIUM', bg: 'linear-gradient(135deg,#050000 0%,#1a0500 100%)', glow: 'rgba(249,115,22,0.3)' },
  { id: 'tactician',  name: 'Tactician',   color: '#22d3ee', tier: 'PREMIUM', bg: 'linear-gradient(135deg,#010408 0%,#020d14 100%)', glow: 'rgba(34,211,238,0.3)' },
  { id: 'gold-luxe',  name: 'Gold Luxe',   color: '#f59e0b', tier: 'PREMIUM', bg: 'linear-gradient(135deg,#020100 0%,#0f0900 100%)', glow: 'rgba(245,158,11,0.3)' },
]

type Plan = 'monthly' | 'yearly'

export default function PremiumPage() {
  const router   = useRouter()
  const [plan,   setPlan]   = useState<Plan>('yearly')
  const [banner, setBanner] = useState<string | null>(null)

  function handleUpgrade() {
    // Phase 12: Razorpay integration
    // For now, show contact-admin message per spec
    setBanner('To activate Premium, contact the admin or use the in-app upgrade flow. Razorpay payments coming soon.')
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg, #04040a)', color: 'var(--color-text, #ffffff)' }}
    >
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: 'rgba(4,4,10,0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <Crown size={16} style={{ color: '#f59e0b' }} />
          <span className="font-bold tracking-widest text-sm font-display" style={{ color: '#f59e0b' }}>
            ZENITH PREMIUM
          </span>
        </div>
        <PremiumBadge />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center pt-8 pb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-bold tracking-widest"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            <Sparkles size={12} />
            ELITE PERFORMANCE UNLOCKED
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--color-text,#fff)' }}>
            Go Beyond Limits
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Unlock all themes, AI insights, elite challenges and more.
          </p>
        </motion.div>

        {/* ── Theme previews ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            5 THEMES INCLUDED
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {THEMES_PREVIEW.map((t) => (
              <div
                key={t.id}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
              >
                {/* Mini phone mockup */}
                <div
                  className="w-14 h-24 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background:  t.bg,
                    border:      `1px solid ${t.tier === 'FREE' ? 'rgba(0,245,255,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    boxShadow:   `0 4px 16px ${t.glow}`,
                  }}
                >
                  {t.tier === 'PREMIUM' && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.0)' }}>
                      <Crown size={14} style={{ color: '#f59e0b', opacity: 0.9 }} />
                    </div>
                  )}
                  {/* Fake habit rows */}
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-1.5 rounded-full mb-1"
                      style={{ background: `${t.color}${i === 1 ? '66' : '22'}` }} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-center" style={{ color: t.color, fontSize: 9 }}>
                  {t.name}
                </span>
                <span className="text-xs rounded px-1" style={{
                  background: t.tier === 'FREE' ? 'rgba(0,245,255,0.1)' : 'rgba(245,158,11,0.1)',
                  color:      t.tier === 'FREE' ? '#00f5ff' : '#f59e0b',
                  fontSize:   8,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}>
                  {t.tier}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Plan toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex rounded-xl p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {(['monthly', 'yearly'] as Plan[]).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all relative"
              style={{
                background: plan === p ? 'rgba(245,158,11,0.15)' : 'transparent',
                color:      plan === p ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                border:     plan === p ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
              }}
            >
              {p === 'yearly' && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-xs font-black"
                  style={{ background: '#f59e0b', color: '#000', fontSize: 9, letterSpacing: '0.05em' }}>
                  SAVE ₹489
                </span>
              )}
              {p === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </motion.div>

        {/* ── Pricing card ── */}
        <motion.div
          key={plan}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)',
            border:     '1px solid rgba(245,158,11,0.3)',
            boxShadow:  '0 8px 32px rgba(245,158,11,0.08)',
          }}
        >
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-black" style={{ color: '#f59e0b' }}>
              ₹{plan === 'monthly' ? PREMIUM_PRICING.MONTHLY_DISPLAY : PREMIUM_PRICING.YEARLY_DISPLAY}
            </span>
            <span className="text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              /{plan === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {plan === 'yearly' && (
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              That&apos;s just ₹108/month — save ₹489 vs monthly
            </p>
          )}

          <button
            onClick={handleUpgrade}
            className="w-full py-3.5 rounded-xl font-black tracking-widest text-sm transition-all active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color:      '#000',
              boxShadow:  '0 4px 20px rgba(245,158,11,0.4)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Crown size={16} />
              UPGRADE TO PREMIUM
            </span>
          </button>
        </motion.div>

        {/* ── Banner ── */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-xl p-4 mb-6"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Zap size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{banner}</p>
              <button onClick={() => setBanner(null)}>
                <X size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Feature comparison ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            WHAT&apos;S INCLUDED
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header */}
            <div className="grid grid-cols-3 text-xs font-bold tracking-widest px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
              <span>FEATURE</span>
              <span className="text-center">FREE</span>
              <span className="text-center" style={{ color: '#f59e0b' }}>PREMIUM</span>
            </div>

            {FEATURE_TABLE_ORDER.map((key, i) => {
              const f = PREMIUM_FEATURES[key]
              return (
                <div
                  key={key}
                  className="grid grid-cols-3 px-4 py-3 items-center text-xs"
                  style={{ borderBottom: i < FEATURE_TABLE_ORDER.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-base leading-none">{f.icon}</span>
                    <span className="font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{f.label}</span>
                  </div>
                  <div className="text-center" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                    {f.free}
                  </div>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1" style={{ color: '#f59e0b', fontSize: 10 }}>
                      <Check size={10} />
                      <span>{f.premium}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Perks bullets ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 mb-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              PREMIUM PERKS
            </span>
          </div>
          {[
            '🎨 All 5 themes — Cosmic, Inferno, Tactician, Gold Luxe',
            '🤖 Weekly AI-generated performance report',
            '🏆 Elite challenges — 30-Day Warrior, 90-Day Legend',
            '📊 Full analytics export as shareable PNG',
            '∞  Unlimited habits (free limit: 7)',
            '💎 Exclusive Premium achievements & badge',
            '⚡  Priority support & early access to new features',
          ].map((perk) => (
            <div key={perk} className="flex items-start gap-3 py-1.5">
              <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{perk}</span>
            </div>
          ))}
        </motion.div>

        {/* ── CTA repeat ── */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={handleUpgrade}
          className="w-full py-4 rounded-2xl font-black tracking-widest text-sm"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color:      '#000',
            boxShadow:  '0 8px 32px rgba(245,158,11,0.35)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Crown size={18} />
            GET PREMIUM — ₹{plan === 'monthly' ? '149/mo' : '1299/yr'}
          </span>
        </motion.button>

        <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Payments via Razorpay — UPI, Cards, Netbanking
        </p>
      </div>
    </div>
  )
}
