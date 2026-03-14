import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not add logic between this and createServerClient
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Route Protection Rules ────────────────────────────────────
  
  // 1. Auth routes: redirect to app if already logged in
  if (user && (pathname === '/login' || pathname === '/auth/login' || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/today'
    return NextResponse.redirect(url)
  }

  // 2. App routes: redirect to login if not authenticated
  if (!user && pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Admin routes: require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Check admin role in database
    const { data: userData } = await supabase
      .from('users')
      .select('role, blocked')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin' || userData.blocked) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/today'
      return NextResponse.redirect(url)
    }
  }

  // 4. Onboarding: authenticated users who haven't completed onboarding
  if (user && pathname.startsWith('/app') && pathname !== '/app/today') {
    // Check if user has completed onboarding (has username set)
    // This is handled per-page for more granular control
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
