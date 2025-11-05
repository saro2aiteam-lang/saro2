import Pricing from '@/page-components/Pricing'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing Plans - Choose Your AI Video Generation Plan | Sora2',
  description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora 2 technology.',
  keywords: 'video generation pricing, AI video price, Sora2 pricing, video creation cost, AI tool pricing',
  openGraph: {
    title: 'Pricing Plans - Sora2',
    description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options.',
    images: ['/placeholder.svg'],
    type: 'website',
    url: 'https://saro2.ai/plans'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Plans - Sora2',
    description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans.',
    images: ['/placeholder.svg']
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlansPage() {
  return <Pricing />
}


