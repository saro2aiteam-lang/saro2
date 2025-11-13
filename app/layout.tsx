import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Providers } from './providers'
import CriticalCSSWrapper from '@/components/CriticalCSSWrapper'
import TooltipProviderWrapper from '@/components/TooltipProviderWrapper'
import AnalyticsScripts from '@/components/AnalyticsScripts'
import PageView from './pageview'
import './globals.css'
 

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    template: '%s | Saro 2',
    default: 'Sora 2 Video Generator | AI Text-to-Video Creator Online'
  },
  description: 'Sora 2 AI video generator - Create cinematic videos with Sora 2 technology. Sora 2 text-to-video, image-to-video, and multi-scene storyboard. No watermark, no invite code required. Start creating with Sora 2 today!',
  authors: [{ name: 'Saro 2 Team' }],
  creator: 'Saro 2',
  publisher: 'Saro 2',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://saro2.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://saro2.ai',
    siteName: 'Saro 2',
    title: 'Sora 2 Video Generator | AI Text-to-Video Creator Online | Saro',
    description: 'Sora 2 AI video generator: Create cinematic videos from text prompts with Sora 2 technology. Advanced motion realism, multi-shot storytelling, and creative control. Sora 2 text-to-video, image-to-video, and multi-scene storyboard creator.',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Video Generator | AI Text-to-Video Creator Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Video Generator | AI Text-to-Video Creator Online | Saro',
    description: 'Sora 2 AI video generator: Create cinematic videos from text prompts with Sora 2 technology. Advanced motion realism, multi-shot storytelling, and creative control.',
    images: ['https://saro2.ai/logo.png'],
    creator: '@saro2_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || 'RXG1GciT_6Lk-VckDXsTp0wkUZYZfI0RDWy-9D_P-0E',
    other: {
      'msvalidate.01': process.env.BING_VERIFICATION_CODE || 'your-bing-verification-code',
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`min-h-screen bg-background font-sans antialiased ${inter.variable}`}>
        <AnalyticsScripts />
        
        {/* JSON-LD */}
        <script
          id="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Saro 2",
              "url": "https://saro2.ai",
              "logo": "https://saro2.ai/logo.png",
              "description": "Saro 2 AI video generation platform. Create cinematic videos with Sora 2 text-to-video, image-to-video, and multi-scene storyboard features. Sora 2 video generator with no watermark.",
              "sameAs": [
                "https://twitter.com/saro2_ai"
              ]
            })
          }}
        />
        <script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://saro2.ai",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://saro2.ai/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <Providers>
          <TooltipProviderWrapper>
            <CriticalCSSWrapper />
            <Toaster />
            <Sonner />
            <PageView />
            {children}
          </TooltipProviderWrapper>
        </Providers>
      </body>
    </html>
  )
}
