import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Text to Video Generator | AI Video Creator Online',
  description: 'Sora 2 text-to-video generator - Create cinematic videos from text prompts using Sora 2 AI technology. Sora 2 text-to-video with advanced motion realism. No watermark, no invite code. Start creating with Sora 2 now!',
  alternates: {
    canonical: 'https://saro2.ai/text-to-video',
  },
  openGraph: {
    title: 'Sora 2 Text to Video Generator | AI Video Creator Online',
    description: 'Sora 2 text-to-video generator - Create cinematic videos from text prompts using Sora 2 AI. Sora 2 text-to-video with advanced motion realism. No watermark required. Try Sora 2 now!',
    url: 'https://saro2.ai/text-to-video',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Text to Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Text to Video Generator | AI Video Creator Online',
    description: 'Sora 2 text-to-video generator - Create cinematic videos from text prompts. Sora 2 text-to-video with advanced motion realism. No watermark required.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



