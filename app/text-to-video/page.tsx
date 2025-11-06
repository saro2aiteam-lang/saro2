import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Text to Video Generator | AI Video Creator',
  description: 'Sora 2 text-to-video generator. Create cinematic videos from text prompts using Sora 2-style AI technology. High-quality videos with advanced motion realism.',
  keywords: 'sora 2, sora 2 text to video, sora 2 generator, sora 2 online, sora 2 ai video, sora 2 text to video generator, sora 2 video creator, sora 2 ai, sora 2 alternative, text to video, AI video generator',
  alternates: {
    canonical: 'https://saro2.ai/text-to-video',
  },
  openGraph: {
    title: 'Sora 2 Text to Video Generator | AI Video Creator Online',
    description: 'Use Sora 2 AI to create cinematic videos from text prompts. Sora 2 text-to-video generator produces high-quality videos with advanced motion realism.',
    url: 'https://saro2.ai/text-to-video',
    images: ['https://saro2.ai/logo.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Text to Video Generator | AI Video Creator Online',
    description: 'Use Sora 2 AI to create cinematic videos from text prompts. Sora 2 text-to-video generator produces high-quality videos.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



