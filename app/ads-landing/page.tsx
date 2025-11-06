import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Video Generator | Professional Video Creation Platform | Saro2.ai',
  description: 'Create professional AI-generated videos with our independent video generation platform. Text-to-video, image-to-video, and multi-scene storyboard features. Commercial licensing included.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdsLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Saro2.ai</span>
            </div>
            <Link href="/text-to-video">
              <Button variant="outline" size="sm">
                Start Creating
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Professional AI Video Generation Platform
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create cinematic videos from text or images. Independent platform with commercial licensing, no platform watermarks, and professional quality output.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/text-to-video">
              <Button size="lg" className="w-full sm:w-auto">
                Start Creating Videos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Saro2.ai?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Text-to-Video</h3>
              <p className="text-muted-foreground">
                Transform your text prompts into cinematic videos with advanced AI technology. Create professional content in minutes.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Image-to-Video</h3>
              <p className="text-muted-foreground">
                Convert static images into dynamic video sequences. Perfect for product showcases and marketing materials.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Multi-Scene Storyboard</h3>
              <p className="text-muted-foreground">
                Create longer-form videos with consistent characters across multiple scenes. Ideal for brand storytelling.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You Get
          </h2>
          <div className="space-y-4">
            {[
              'Commercial licensing included',
              'No platform watermarks on premium plans',
              'Fast render times',
              'HD quality output',
              'Consistent character identity',
              '25-30 second video support',
              'Professional audio synchronization',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Professional Videos?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with free credits and upgrade when you're ready for more.
          </p>
          <Link href="/text-to-video">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground text-center">
            Saro2.ai is an independent AI video generation platform. It is not affiliated with, endorsed by, or sponsored by OpenAI or any official "Sora" products. All trademarks belong to their respective owners. We provide video generation services using our own proprietary technology.
          </p>
        </div>
      </section>
    </main>
  )
}

