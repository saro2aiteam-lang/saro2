import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Watermark Remover',
  description: 'Remove Sora watermarks from Sora-hosted videos in seconds. API-ready, commercial use, simple input for sora.chatgpt.com links.',
  openGraph: {
    title: 'Watermark Remover',
    description: 'Paste a Sora video link and remove the watermark instantly.',
    url: 'https://saro2.ai/watermark-remover',
    images: ['https://saro2.ai/placeholder.svg'],
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



