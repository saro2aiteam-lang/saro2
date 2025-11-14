import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
  description: 'Sora 2 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora 2 Pro storyboard with scene control and visual consistency. No watermark required. Try Sora 2 Pro now!',
  alternates: {
    canonical: 'https://saro2.ai/sora-2-storyboard',
  },
  openGraph: {
    title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora 2 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora 2 Pro storyboard with scene control. No watermark required. Try Sora 2 Pro now!',
    url: 'https://saro2.ai/sora-2-storyboard',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Pro Storyboard Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora 2 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora 2 Pro storyboard. No watermark required.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300

