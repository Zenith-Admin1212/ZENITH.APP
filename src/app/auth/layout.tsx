import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full viewport, dark bg, no extra chrome
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {children}
    </div>
  )
}
