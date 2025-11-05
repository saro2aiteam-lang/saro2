import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Transform Text into Product Marketing Videos | aivido',
  description: 'Produce premium product promotional videos using plain text inputs. Excellent solution for rapid video advertisement creation on TikTok, Shopify, and various social platforms.',
  openGraph: {
    title: 'Transform Text into Product Marketing Videos | aivido',
    description: 'Produce premium product promotional videos using plain text inputs. Excellent solution for rapid video advertisement creation on TikTok, Shopify, and various social platforms.',
    url: 'https://saro2.ai/text-to-video',
    images: ['https://saro2.ai/placeholder.svg']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



