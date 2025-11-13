import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
  description: 'Sora 2 Pro Storyboard - Create professional multi-scene videos with sequential shots, visual consistency and precise duration control. Sora 2 Pro storyboard generator. No watermark required. Try Sora 2 Pro now!',
  alternates: {
    canonical: 'https://saro2.ai/sora-pro-storyboard',
  },
  openGraph: {
    title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora 2 Pro Storyboard - Create professional multi-scene videos with sequential shots, visual consistency and precise duration control. Sora 2 Pro storyboard. No watermark required. Try Sora 2 Pro now!',
    url: 'https://saro2.ai/sora-pro-storyboard',
    siteName: 'Saro 2',
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
    title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora 2 Pro Storyboard - Create professional multi-scene videos with sequential shots and visual consistency. Sora 2 Pro storyboard. No watermark required.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300
