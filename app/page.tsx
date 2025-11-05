import Hero from '@/components/home/Hero'
import KeyFeatures from '@/components/home/KeyFeatures'
import Testimonials from '@/components/home/Testimonials'
import HowItWorks from '@/components/home/HowItWorks'
import DemoGallery from '@/components/home/DemoGallery'
import PricingTeaser from '@/components/home/PricingTeaser'
import FaqTeaser from '@/components/home/FaqTeaser'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
  description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
  keywords: 'AI video ads, multi-scene storyboard, consistent characters, 25 second AI video, vertical ad templates, TikTok ad generator, Shopify product video, AI storyboard builder',
  openGraph: {
    title: 'Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
    description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
    images: ['https://saro2.ai/placeholder.svg'],
    type: 'website',
    url: 'https://saro2.ai/'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 AI Video Generator | Text-to-Video with Sora-Level Quality',
    description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
    images: ['https://saro2.ai/placeholder.svg']
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
}

export default function HomePage() {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Sora 2',
        description: 'Create cinematic videos from text prompts. Advanced motion realism, multi-shot storytelling, and creative control. Independent platform, easy to use.',
        url: 'https://saro2.ai',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free to try with paid advanced features'
        },
        creator: {
          '@type': 'Organization',
          name: 'Sora 2',
          url: 'https://saro2.ai'
        },
        featureList: [
          'Multi-scene storyboard builder',
          'Consistent character identity',
          '25-30 second video extension',
          'Ad-ready layouts and templates',
          'Vertical ad generation'
        ],
        keywords: []
      }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main>
        <Hero />
        <DemoGallery />
        <KeyFeatures />
        <Testimonials />
        <HowItWorks />
        {/* Lightweight SEO copy block (non-hero) targeting long-tail queries */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto text-sm text-muted-foreground leading-relaxed">
            <h2 className="sr-only">AI Video Ads Generator</h2>
            <p>
              Sora 2 AI video ads generator: create multi-scene video ads with consistent characters for TikTok, Shopify, and product promotions. Generate{' '}
              <strong className="font-semibold">25+ second AI video ads</strong> with{' '}
              <strong className="font-semibold">consistent character identity</strong> across multiple scenes. Perfect for brand storytelling, product showcases, and vertical social media ads.
            </p>
          </div>
        </section>
        <PricingTeaser />
        <FaqTeaser />
      </main>
      <Footer />
    </>
  )
}
