import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pro Storyboard - Multi-Scene Video Generation',
  description: 'Create professional multi-scene videos with Sora 2 Pro Storyboard. Generate sequential shots with visual consistency and precise duration control.',
  openGraph: {
    title: 'Sora 2 Pro Storyboard - Multi-Scene Video Generation',
    description: 'Create professional multi-scene videos with sequential shots, visual consistency, and precise duration control.',
    url: 'https://saro2.ai/storyboard',
    images: ['https://saro2.ai/placeholder.svg']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300
