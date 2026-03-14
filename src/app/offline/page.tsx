'use client'
// app/offline/page.tsx — Served by the service worker when a navigation request fails.

export default function OfflinePage() {
  return (
    <div
      style={{
        margin: 0,
        background: '#04040a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 380 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 1.5rem',
            background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          }}
        >
          📡
        </div>
        <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.12em', color: '#00f5ff', margin: '0 0 0.5rem', textShadow: '0 0 24px rgba(0,245,255,0.5)' }}>
          YOU&apos;RE OFFLINE
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: '0 0 2rem' }}>
          No connection detected. Your streak data and habits are saved —
          reconnect to sync your progress.
        </p>
        <div style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.12)', borderRadius: 16, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          {[
            ['🔥', 'Your streak is safe — logs are stored locally'],
            ['⚡', 'XP earned offline will sync when you reconnect'],
            ['📋', 'Previously visited pages may still be accessible'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0', alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff', borderRadius: 14, padding: '0.75rem 2rem', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', boxShadow: '0 0 16px rgba(0,245,255,0.15)' }}
        >
          ↺ TRY AGAIN
        </button>
      </div>
    </div>
  )
}
