import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Sparkles, Film, Image as ImageIcon, Clapperboard } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Sora 2 Video Generator – Create Sora 2-Style Videos Online | Saro.ai',
  description: 'Sora 2 Video Generator - Create Sora 2-style videos instantly without official access. Independent multi-model AI platform offering Sora-compatible, Sora 2-style video generation. Text-to-video, image-to-video, and 25-second storyboard. No watermark, no regional limits.',
  alternates: {
    canonical: 'https://saro2.ai/sora-2-video-generator',
  },
  openGraph: {
    title: 'Sora 2 Video Generator – Create Sora 2-Style Videos Online | Saro.ai',
    description: 'Create Sora 2-style videos instantly without official access. Independent multi-model AI platform offering Sora-compatible video generation. No watermark, no regional limits.',
    url: 'https://saro2.ai/sora-2-video-generator',
    siteName: 'Saro.ai',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Video Generator – Create Sora 2-Style Videos Online | Saro.ai',
    description: 'Create Sora 2-style videos instantly without official access. Independent multi-model AI platform. No watermark, no regional limits.',
    images: ['https://saro2.ai/logo.png']
  },
}

const features = [
  {
    icon: Play,
    title: 'Sora 2-Style Text-to-Video',
    description: 'Generate cinematic videos from text prompts using Sora-compatible models. Create professional content instantly.',
    href: '/text-to-video'
  },
  {
    icon: ImageIcon,
    title: 'Sora 2-Style Image-to-Video',
    description: 'Transform static images into dynamic Sora 2-style videos. Perfect for product demos and creative projects.',
    href: '/image-to-video'
  },
  {
    icon: Clapperboard,
    title: '25s Sora 2-Style Storyboard',
    description: 'Create Sora 2 Storyboard (multi-scene) videos up to 25 seconds. Ideal for ads, narratives, and longer-form content.',
    href: '/sora-2-storyboard'
  },
]

export default function Sora2VideoGeneratorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Sora 2 Video Generator',
    description: 'Saro.ai is an independent multi-model AI video platform that helps creators generate Sora 2-style videos without waiting for official access. We support Sora-compatible models, Sora 2-style generation, text-to-video, image-to-video and 25-second storyboard sequences.',
    url: 'https://saro2.ai/sora-2-video-generator',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Sora 2 Video Generator',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Independent multi-model AI video generation platform offering Sora 2-style video creation. Saro.ai uses Sora-compatible models and other third-party AI video engines. Saro.ai is not affiliated with OpenAI, Google or Sora 2.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-background to-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Independent Multi-Model AI Generator</span>
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Sora 2 Video Generator (Independent Helper Tool)
              </h1>

              {/* Opening Paragraph */}
              <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
                <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-4">
                  Saro.ai is an independent multi-model AI video platform that helps creators generate Sora 2-style videos without waiting for official access.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  We support Sora-compatible models, Sora 2-style generation, text-to-video, image-to-video and 25-second storyboard sequences.
                </p>
                <p className="text-base text-muted-foreground/80 leading-relaxed">
                  This page is for creators searching for "Sora 2 video generator" tools and Sora 2-style workflows. <strong>Saro.ai is not the official Sora 2 website.</strong>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href="/text-to-video">
                    <Play className="w-5 h-5 mr-2" />
                    Start Creating Sora 2-Style Videos
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href="/plans">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Sora 2-Style Video Generation Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create professional Sora 2-style videos using our multi-model generation pipeline
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={feature.href}>Try Now</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Who Uses Sora 2-Style Video Generation?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Perfect for creators, marketers, and businesses looking for Sora 2-style results
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">Creators & Influencers</h3>
                <p className="text-sm text-muted-foreground">
                  Generate Sora 2-style content for social media without watermarks
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">E-commerce & Shopify</h3>
                <p className="text-sm text-muted-foreground">
                  Create Sora 2-style product videos and ads that convert
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">Small Businesses</h3>
                <p className="text-sm text-muted-foreground">
                  Professional Sora 2-style videos at a fraction of production costs
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">Marketers</h3>
                <p className="text-sm text-muted-foreground">
                  A/B test Sora 2-style video concepts quickly and affordably
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="py-12 bg-background border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-semibold mb-3">Important Disclaimer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Saro.ai is an independent AI video generation platform. We use Sora 2–style, Sora-compatible, Veo-compatible and other third-party models to offer multi-model video generation. Saro.ai is not affiliated with OpenAI, Google or Sora 2. This page is designed to help creators find Sora 2-style video generation tools and is not the official Sora 2 service.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}


