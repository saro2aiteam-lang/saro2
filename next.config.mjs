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
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
      'react-markdown',
    ], // Optimize icon and component imports
  },
  // Enable SWC minification for better tree shaking
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
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
      // Video assets caching
      {
        source: '/videos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image assets caching
      {
        source: '/(.*\\.(jpg|jpeg|png|webp|avif|svg|gif))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
      // Add redirects here if needed
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