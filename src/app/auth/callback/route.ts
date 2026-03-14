import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ═══════════════════════════════════════════════════════════════
//  OAuth Callback Handler
//  After Google OAuth redirects back here, exchange code for session
//  then redirect to onboarding (new user) or dashboard (returning)
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app/today'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.user.id)
        .single()

      const hasOnboarded = !!profile?.username

      const redirectTo = hasOnboarded ? next : '/onboard'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
