import type { Metadata, Viewport } from 'next'
import {
  Orbitron,
  Rajdhani,
  Exo_2,
  Bebas_Neue,
  Barlow,
  Share_Tech_Mono,
  Share_Tech,
  Cinzel,
  Raleway,
} from 'next/font/google'
import { ThemeProvider }  from '@/lib/themes/theme-provider'
import { QueryProvider }  from '@/components/shared/QueryProvider'
import './globals.css'

// ── next/font — loaded at build time, no render-blocking @import ─
const orbitron      = Orbitron({ subsets: ['latin'], weight: ['400','500','600','700','800','900'], variable: '--next-font-orbitron',     display: 'swap' })
const rajdhani      = Rajdhani({ subsets: ['latin'], weight: ['300','400','500','600','700'],       variable: '--next-font-rajdhani',     display: 'swap' })
const exo2          = Exo_2({ subsets: ['latin'],    weight: ['300','400','500','600','700'],       variable: '--next-font-exo2',         display: 'swap', style: ['normal','italic'] })
const bebasNeue     = Bebas_Neue({ subsets: ['latin'], weight: ['400'],                             variable: '--next-font-bebas',        display: 'swap' })
const barlow        = Barlow({ subsets: ['latin'],   weight: ['300','400','500','600','700'],       variable: '--next-font-barlow',       display: 'swap' })
const shareTechMono = Share_Tech_Mono({ subsets: ['latin'], weight: ['400'],                       variable: '--next-font-share-mono',   display: 'swap' })
const shareTech     = Share_Tech({ subsets: ['latin'], weight: ['400'],                            variable: '--next-font-share',        display: 'swap' })
const cinzel        = Cinzel({ subsets: ['latin'],   weight: ['400','500','600','700','800','900'], variable: '--next-font-cinzel',       display: 'swap' })
const raleway       = Raleway({ subsets: ['latin'],  weight: ['300','400','500','600','700'],       variable: '--next-font-raleway',      display: 'swap' })

export const metadata: Metadata = {
  title: {
    template: '%s | ZENITH',
    default:  'ZENITH — Elite Performance System',
  },
  description: 'Track habits, level up your life. The elite performance system built for discipline.',
  keywords:    ['habits', 'productivity', 'performance', 'tracking', 'discipline', 'streak'],
  authors:     [{ name: 'ZENITH' }],
  creator:     'ZENITH',

  manifest: '/manifest.json',

  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'ZENITH',
  },

  openGraph: {
    title:       'ZENITH — Elite Performance System',
    description: 'Track habits, level up your life.',
    url:         process.env.NEXT_PUBLIC_APP_URL,
    siteName:    'ZENITH',
    images: [
      {
        url:    '/images/og-image.png',
        width:  1200,
        height: 630,
        alt:    'ZENITH — Elite Performance System',
      },
    ],
    locale: 'en_US',
    type:   'website',
  },

  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor:     '#04040a',
  width:          'device-width',
  initialScale:   1,
  maximumScale:   1,
  userScalable:   false,
  viewportFit:    'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fontVars = [
    orbitron.variable, rajdhani.variable, exo2.variable, bebasNeue.variable,
    barlow.variable, shareTechMono.variable, shareTech.variable, cinzel.variable,
    raleway.variable,
  ].join(' ')

  return (
    <html lang="en" data-theme="dark-cyber" className={fontVars} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zenith-theme');if(t){var p=JSON.parse(t);if(p&&p.state&&p.state.activeTheme){document.documentElement.setAttribute('data-theme',p.state.activeTheme);}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="custom-scroll" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
