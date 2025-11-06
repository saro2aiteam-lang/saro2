import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Watermark Remover | Remove Watermark from Sora 2 Videos',
  description: 'Remove watermarks from Sora 2 videos instantly. Sora 2 watermark remover tool for Sora 2 Pro and Sora 2 generated videos. API-ready, commercial use, simple input for sora.chatgpt.com links. Remove Sora 2 watermark in seconds.',
  keywords: 'sora 2 watermark remover, remove sora 2 watermark, sora 2 watermark removal, sora 2 pro watermark remover, remove watermark, watermark remover, sora 2, sora 2 ai',
  openGraph: {
    title: 'Sora 2 Watermark Remover | Remove Watermark from Sora 2 Videos',
    description: 'Remove watermarks from Sora 2 videos instantly. Sora 2 watermark remover tool for Sora 2 Pro and Sora 2 generated videos. API-ready, commercial use.',
    url: 'https://saro2.ai/watermark-remover',
    images: ['https://saro2.ai/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Watermark Remover | Remove Watermark from Sora 2 Videos',
    description: 'Remove watermarks from Sora 2 videos instantly. Sora 2 watermark remover tool for Sora 2 Pro and Sora 2 generated videos.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



