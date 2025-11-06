import Pricing from '@/page-components/Pricing'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing Plans - Choose Your AI Video Plan | Sora2',
  description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora 2 technology.',
  keywords: 'video generation pricing, AI video price, Sora2 pricing, video creation cost, AI tool pricing',
  alternates: {
    canonical: 'https://saro2.ai/plans',
  },
  openGraph: {
    title: 'Pricing Plans - Sora2',
    description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options.',
    url: 'https://saro2.ai/plans',
    siteName: 'Sora 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora2 Pricing Plans',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Plans - Sora2',
    description: 'View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans.',
    images: ['https://saro2.ai/logo.png']
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlansPage() {
  return <Pricing />
}


