import type { Metadata } from 'next'
import { redirect }    from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin | ZENITH',
  robots: { index: false, follow: false },
}

// ═══════════════════════════════════════════════════════════════
//  /admin/* layout — server-side role guard (layer 2 of 3)
//
//  Layer 1: middleware.ts (fastest — edge-level redirect)
//  Layer 2: This layout (server component DB verification)
//  Layer 3: AdminPanel.tsx (client-side role check + UI guard)
//
//  Intentionally excludes AppShell, BottomNav, TopBar.
// ═══════════════════════════════════════════════════════════════

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: dbUser } = await supabase
    .from('users')
    .select('role, blocked')
    .eq('id', authUser.id)
    .single()

  if (!dbUser || dbUser.role !== 'admin' || dbUser.blocked) {
    redirect('/app/today')
  }

  return (
    <div data-theme="dark-cyber" style={{ minHeight: '100vh', background: '#040408' }}>
      {children}
    </div>
  )
}
