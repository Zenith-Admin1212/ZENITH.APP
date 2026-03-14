import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: { template: '%s | ZENITH', default: 'ZENITH' },
}

// ── /app/* layout ─────────────────────────────────────────────────
// Every page inside /app/* is wrapped by AppShell.
// AppShell is a Client Component that handles:
//  - Auth session init
//  - Store sync
//  - Bottom nav, top bar, side menu, notifications, modals, particles
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
