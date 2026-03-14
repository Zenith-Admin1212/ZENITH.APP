'use client'

import { useState }   from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  Admin Shared UI Primitives
//
//  ConfirmDialog  — required before every destructive action
//  StatCard       — dashboard metric tile
//  AdminTable     — clean dark table with sticky header
//  StatusBadge    — coloured pill for status/role/plan fields
//  SectionHeader  — tab title + refresh button
//  EmptyState     — empty table placeholder
// ═══════════════════════════════════════════════════════════════

// ── Admin colour tokens (admin panel only — no theme vars) ────
export const A = {
  bg:       '#040408',
  surface:  '#0a0a12',
  surface2: '#111120',
  border:   'rgba(0,245,255,0.12)',
  borderHi: 'rgba(0,245,255,0.3)',
  cyan:     '#00f5ff',
  muted:    'rgba(255,255,255,0.4)',
  faint:    'rgba(255,255,255,0.2)',
  danger:   '#ef4444',
  warn:     '#f97316',
  success:  '#22c55e',
  gold:     '#f59e0b',
  text:     'rgba(255,255,255,0.87)',
}

// ── ConfirmDialog ─────────────────────────────────────────────

interface ConfirmDialogProps {
  title:       string
  message:     string
  confirmText?: string
  danger?:     boolean
  onConfirm:   () => void
  onCancel:    () => void
}

export function ConfirmDialog({
  title, message, confirmText = 'Confirm', danger = true,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: A.surface2, border: `1px solid ${danger ? A.danger + '50' : A.borderHi}` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(0,245,255,0.1)' }}>
              <AlertTriangle size={17} style={{ color: danger ? A.danger : A.cyan }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: A.text }}>{title}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: A.muted }}>{message}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: A.surface, border: `1px solid ${A.border}`, color: A.muted }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(0,245,255,0.1)',
                border:     `1px solid ${danger ? A.danger + '60' : A.cyan + '60'}`,
                color:      danger ? A.danger : A.cyan,
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── StatCard ──────────────────────────────────────────────────

interface StatCardProps {
  icon:    string
  label:   string
  value:   number | string
  color?:  string
  sub?:    string
}

export function StatCard({ icon, label, value, color = A.cyan, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl"
      style={{ background: A.surface, border: `1px solid ${A.border}` }}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className="font-mono font-black text-2xl" style={{ color }}>{value}</span>
      </div>
      <div>
        <p className="font-semibold text-xs" style={{ color: A.text }}>{label}</p>
        {sub && <p className="text-2xs mt-0.5" style={{ color: A.faint, fontSize: '10px' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────

interface StatusBadgeProps {
  value:   string
  variant?: 'plan' | 'role' | 'status' | 'feedback'
}

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  premium:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  free:     { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
  admin:    { bg: 'rgba(0,245,255,0.12)',   color: '#00f5ff' },
  user:     { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
  active:   { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  blocked:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  open:     { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  reviewed: { bg: 'rgba(0,245,255,0.10)',   color: '#00f5ff' },
  resolved: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  bug:      { bg: 'rgba(239,68,68,0.10)',   color: '#f87171' },
  feature:  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
  general:  { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const c = BADGE_COLORS[value] ?? BADGE_COLORS.general
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold"
      style={{ background: c.bg, color: c.color, fontSize: '10px' }}>
      {value}
    </span>
  )
}

// ── SectionHeader ─────────────────────────────────────────────

interface SectionHeaderProps {
  title:     string
  subtitle?: string
  onRefresh?: () => void
  children?:  React.ReactNode
}

export function SectionHeader({ title, subtitle, onRefresh, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4"
      style={{ borderBottom: `1px solid ${A.border}` }}>
      <div>
        <h2 className="font-bold text-base" style={{ color: A.text }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: A.muted }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onRefresh && (
          <button onClick={onRefresh}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: A.surface2, border: `1px solid ${A.border}` }}>
            <RefreshCw size={13} style={{ color: A.muted }} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────

export function EmptyState({ icon = '📭', message = 'No data found' }: { icon?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm" style={{ color: A.muted }}>{message}</p>
    </div>
  )
}

// ── LoadingSkeleton ───────────────────────────────────────────

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl animate-pulse"
          style={{ background: A.surface2, opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function AdminInput({ label, ...props }: AdminInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold" style={{ color: A.muted }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: A.surface2,
          border:     `1px solid ${A.border}`,
          color:      A.text,
          ...(props.style ?? {}),
        }}
      />
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function AdminTextarea({ label, ...props }: AdminTextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold" style={{ color: A.muted }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
        style={{
          background: A.surface2,
          border:     `1px solid ${A.border}`,
          color:      A.text,
          ...(props.style ?? {}),
        }}
      />
    </div>
  )
}

// ── ActionButton ──────────────────────────────────────────────

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warn' | 'ghost' | 'success'
  size?:    'xs' | 'sm'
}

export function ActionButton({
  variant = 'ghost', size = 'sm', children, ...props
}: ActionButtonProps) {
  const colors = {
    primary: { bg: 'rgba(0,245,255,0.1)',   border: A.cyan + '50',  color: A.cyan    },
    danger:  { bg: 'rgba(239,68,68,0.1)',   border: A.danger + '50', color: A.danger  },
    warn:    { bg: 'rgba(249,115,22,0.1)',  border: A.warn + '50',  color: A.warn    },
    success: { bg: 'rgba(34,197,94,0.1)',   border: A.success + '50', color: A.success },
    ghost:   { bg: A.surface,              border: A.border,        color: A.muted   },
  }
  const c = colors[variant]
  const pad = size === 'xs' ? 'px-2 py-1' : 'px-3 py-1.5'
  const fs  = size === 'xs' ? '10px' : '11px'

  return (
    <button
      {...props}
      className={`${pad} rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: fs }}
    >
      {children}
    </button>
  )
}
