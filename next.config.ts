import type { NextConfig } from 'next'
import { SITE_URL } from './lib/site/constants'

// Other addresses that serve the production site. They redirect permanently so search engines index one domain.
const OTHER_HOSTS = ['jadaukofficial.com', 'jada-taupe.vercel.app']

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    // Local Supabase runs on a private IP, which the image optimiser refuses to fetch.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      supabase
        ? { protocol: supabase.protocol.replace(':', '') as 'http' | 'https', hostname: supabase.hostname, port: supabase.port, pathname: '/storage/v1/object/public/**' }
        : { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      // YouTube thumbnails for gallery videos added by link
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
    ],
  },
  async redirects() {
    return OTHER_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: `${SITE_URL}/:path*`,
      permanent: true,
    }))
  },
}

export default nextConfig
