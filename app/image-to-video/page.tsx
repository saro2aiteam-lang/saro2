import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Image to Video Generator | Transform Photos into Cinematic Videos',
  description: 'Use Sora 2 AI to convert product photos into animated video advertisements. Sora 2 image-to-video technology transforms static images into cinematic videos with natural motion. Perfect for Shopify stores and TikTok creators using Sora 2.',
  openGraph: {
    title: 'Sora 2 Image to Video Generator | Transform Photos into Cinematic Videos',
    description: 'Use Sora 2 AI to convert product photos into animated video advertisements. Sora 2 image-to-video technology transforms static images into cinematic videos with natural motion. Perfect for Shopify stores and TikTok creators using Sora 2.',
    url: 'https://saro2.ai/image-to-video',
    images: ['https://saro2.ai/placeholder.svg']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300


