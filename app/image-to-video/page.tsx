import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Image to Video Generator | Sora 2 Alternative | Transform Photos into Cinematic Videos',
  description: 'Sora 2 image-to-video generator, Sora 2 alternative. Convert product photos into animated video advertisements using Sora 2-style AI technology. Sora 2 image-to-video technology transforms static images into cinematic videos with natural motion. Saro2.ai is an independent platform providing Sora 2-quality video generation services.',
  keywords: 'sora 2 image to video, sora 2 photo animation, sora 2 image to video converter, sora 2 ai, sora 2 video generator, image to video, photo to video, AI video generator, sora 2',
  openGraph: {
    title: 'Sora 2 Image to Video Generator | Transform Photos into Cinematic Videos',
    description: 'Use Sora 2 AI to convert product photos into animated video advertisements. Sora 2 image-to-video technology transforms static images into cinematic videos with natural motion.',
    url: 'https://saro2.ai/image-to-video',
    images: ['https://saro2.ai/logo.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Image to Video Generator | Transform Photos into Cinematic Videos',
    description: 'Use Sora 2 AI to convert product photos into animated video advertisements. Sora 2 image-to-video technology transforms static images into cinematic videos.',
    images: ['https://saro2.ai/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300


