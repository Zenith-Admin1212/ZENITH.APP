// ─────────────────────────────────────────────────────────────
//  next.config.js  —  ZENITH
//  Next.js 14 + Vercel deployment
// ─────────────────────────────────────────────────────────────

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kptocdkfnllhuactgdsc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Service-Worker-Allowed',  value: '/' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/app',
        destination: '/app/today',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/app/today',
        permanent: true,
      },
    ]
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
