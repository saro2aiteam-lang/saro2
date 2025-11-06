import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Storyboard - Multi-Scene Video Generation',
  description: 'Create professional multi-scene videos with Sora 2 Pro Storyboard. Generate sequential shots with visual consistency and precise duration control.',
  keywords: 'sora 2 pro storyboard, multi-scene video, sora 2 pro, storyboard generator, AI video storyboard',
  alternates: {
    canonical: 'https://saro2.ai/sora-pro-storyboard',
  },
  openGraph: {
    title: 'Sora 2 Pro Storyboard - Multi-Scene Video Generation',
    description: 'Create professional multi-scene videos with sequential shots, visual consistency, and precise duration control.',
    url: 'https://saro2.ai/sora-pro-storyboard',
    siteName: 'Sora 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Pro Storyboard',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Pro Storyboard - Multi-Scene Video Generation',
    description: 'Create professional multi-scene videos with sequential shots, visual consistency, and precise duration control.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300
