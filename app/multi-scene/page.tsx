import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard',
  description: 'Create multi-scene videos with Sora 2 Pro storyboard builder. Build 25+ second videos with consistent characters across scenes. Perfect for TikTok, YouTube Shorts, and social media ads.',
  keywords: 'sora 2 pro, sora 2 storyboard, sora 2 multi scene, sora 2 pro storyboard, sora 2 multi scene video, sora 2 video generator, sora 2 ai, multi-scene video, storyboard creator, AI video storyboard',
  alternates: {
    canonical: 'https://saro2.ai/multi-scene',
  },
  openGraph: {
    title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard Creator',
    description: 'Create multi-scene videos with Sora 2 Pro storyboard builder. Build 25+ second videos with consistent characters across scenes.',
    url: 'https://saro2.ai/multi-scene',
    images: ['https://saro2.ai/logo.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Pro Multi-Scene Video Generator | Storyboard Creator',
    description: 'Create multi-scene videos with Sora 2 Pro storyboard builder. Build 25+ second videos with consistent characters.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300

