import { createBrowserClient } from '@supabase/ssr'

// ── Env guard — fail fast with a clear error ─────────────────────
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[ZENITH] Missing env var: NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('[ZENITH] Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Singleton browser client — only one instance ever created.
// Used in client components, hooks, and Zustand stores.
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}

export const supabase = createClient()
