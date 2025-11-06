import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard',
  description: 'Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Control scenes and maintain visual consistency.',
  keywords: 'sora 2 pro, sora 2 storyboard, sora 2 multi scene, sora 2 pro storyboard, sora 2 multi scene video, sora 2 video generator, sora 2 ai, multi-scene video, storyboard creator, AI video storyboard',
  alternates: {
    canonical: 'https://saro2.ai/multi-scene',
  },
  openGraph: {
    title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard',
    description: 'Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Control scenes and maintain visual consistency.',
    url: 'https://saro2.ai/multi-scene',
    siteName: 'Sora 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Pro Multi-Scene Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard',
    description: 'Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Control scenes and maintain visual consistency.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300

