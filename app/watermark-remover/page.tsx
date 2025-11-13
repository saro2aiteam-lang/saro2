import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Watermark Remover | Remove Watermark Tool',
  description: 'Sora 2 watermark remover - Remove watermarks from Sora 2 videos instantly. Sora 2 watermark removal tool for Sora 2 Pro and Sora 2 generated videos. API-ready, commercial use. Try Sora 2 watermark remover now!',
  alternates: {
    canonical: 'https://saro2.ai/watermark-remover',
  },
  openGraph: {
    title: 'Sora 2 Watermark Remover | Remove Watermark Tool',
    description: 'Sora 2 watermark remover - Remove watermarks from Sora 2 videos instantly. Sora 2 watermark removal tool for Sora 2 Pro and Sora 2 generated videos. API-ready, commercial use. Try Sora 2 now!',
    url: 'https://saro2.ai/watermark-remover',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Watermark Remover',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Watermark Remover | Remove Watermark Tool',
    description: 'Sora 2 watermark remover - Remove watermarks from Sora 2 videos instantly. Sora 2 watermark removal tool. API-ready, commercial use.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



