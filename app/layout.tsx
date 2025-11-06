import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Providers } from './providers'
import CriticalCSSWrapper from '@/components/CriticalCSSWrapper'
import TooltipProviderWrapper from '@/components/TooltipProviderWrapper'
import './globals.css'
 

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    template: '%s | Saro 2',
    default: 'Saro 2 AI Video Generator | Text-to-Video with Sora-Level Quality'
  },
  description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
  keywords: 'AI video ads, multi-scene storyboard, consistent characters, 25 second AI video, vertical ad templates, TikTok ad generator, Shopify product video, AI storyboard builder',
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
    title: 'Saro 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
    description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
    images: [
      {
        url: 'https://saro2.ai/placeholder.svg',
        width: 1200,
        height: 630,
        alt: 'Saro 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saro 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
    description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
    images: ['https://saro2.ai/placeholder.svg'],
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
    other: {
      'msvalidate.01': 'your-bing-verification-code',
    },
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png'
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
        
        {/* Crisp Chatbox moved to client-only component */}
        
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
              "logo": "/favicon.png",
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
            {children}
          </TooltipProviderWrapper>
        </Providers>
      </body>
    </html>
  )
}
