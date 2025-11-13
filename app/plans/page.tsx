import Pricing from '@/page-components/Pricing'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora 2 Pricing Plans | Choose Your Sora 2 Plan',
  description: 'View Sora 2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora 2 technology.',
  alternates: {
    canonical: 'https://saro2.ai/plans',
  },
  openGraph: {
    title: 'Sora 2 Pricing Plans | Choose Your Sora 2 Plan',
    description: 'View Sora 2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Start creating with Sora 2 today!',
    url: 'https://saro2.ai/plans',
    siteName: 'Saro 2',
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
    title: 'Sora 2 Pricing Plans | Choose Your Sora 2 Plan',
    description: 'View Sora 2 pricing plans. Choose from Basic, Creator, or Pro plans.',
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


