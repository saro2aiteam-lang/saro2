import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Multi-Scene AI Video Generator | aivido',
  description: 'Create engaging multi-scene video content powered by artificial intelligence. Perfect for storytelling and brand narratives. Build longer 25+ second videos with consistent character appearances.',
  openGraph: {
    title: 'Multi-Scene AI Video Generator | aivido',
    description: 'Create engaging multi-scene video content powered by artificial intelligence. Perfect for storytelling and brand narratives. Build longer 25+ second videos with consistent character appearances.',
    url: 'https://saro2.ai/multi-scene',
    images: ['https://saro2.ai/placeholder.svg']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300

