import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Image to Video Generator | Photo to Video Converter',
  description: 'Sora 2 image-to-video generator - Convert photos into animated videos using Sora 2 AI technology. Sora 2 image-to-video converter. Transform static images into cinematic videos. No watermark required. Try Sora 2 now!',
  alternates: {
    canonical: 'https://saro2.ai/image-to-video',
  },
  openGraph: {
    title: 'Sora 2 Image to Video Generator | Photo to Video Converter',
    description: 'Sora 2 image-to-video generator - Convert photos into animated videos using Sora 2 AI. Sora 2 image-to-video converter. Transform static images into cinematic videos. No watermark required. Try Sora 2 now!',
    url: 'https://saro2.ai/image-to-video',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Image to Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Image to Video Generator | Photo to Video Converter',
    description: 'Sora 2 image-to-video generator - Convert photos into animated videos using Sora 2 AI. Sora 2 image-to-video converter. No watermark required.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300


