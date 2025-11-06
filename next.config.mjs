/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(), // 明确指定项目根目录，避免 lockfile 警告
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization for better performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // Optimize icon imports
  },
  // Externalize packages for better compatibility
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'saro2.ai',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false, // Enable Next.js Image optimization for better performance
  },
  // CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Enable compression (Gzip + Brotli handled by server/CDN)
  compress: true,
  // Enable standalone output for deployment
  output: 'standalone',
  // Configure headers for better SEO and performance
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noai, noimageai',
          },
          {
            key: 'Content-Signals',
            value: 'search=yes, ai-train=no',
          },
        ],
      },
      // Static assets caching (Next.js build files)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public folder assets caching
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/placeholder.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/icon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
  // Configure redirects if needed
  async redirects() {
    return [
      // Legacy generate page → Text to Video
      {
        source: '/generate',
        destination: '/text-to-video',
        permanent: true,
      },
      // Invite code page removed → redirect to home
      {
        source: '/sora2-invitecode',
        destination: '/',
        permanent: true,
      },
      // Legacy watermark remover route → watermark-remover
      {
        source: '/sora2-watermark-remover',
        destination: '/watermark-remover',
        permanent: true,
      },
      
    ]
  },
  // Configure rewrites if needed
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ]
  }
}

export default nextConfig