import Blog from '@/page-components/Blog'

export const metadata = {
  title: 'Sora2 Blog | AI Video Generation Tutorials & Insights',
  description: 'Get the latest tips, comparisons, and workflows for creating video with Sora2. Dive into text-to-video guides, image-to-video tutorials, and creative strategies.',
  keywords: 'Sora2 blog,Sora 2 tutorials,AI video generation tips,Sora insights,AI video workflows',
  openGraph: {
    title: 'Sora2 Blog',
    description: 'Explore tutorials and insights for building video experiences with Sora2.',
    images: ['https://saro2.ai/placeholder.svg'],
    type: 'website',
    url: 'https://saro2.ai/blog'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora2 Blog',
    description: 'Explore tutorials and insights for building video experiences with Sora2.',
    images: ['https://saro2.ai/placeholder.svg']
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPage() {
  return <Blog />
}

// Cache blog index with ISR for 10 minutes
export const revalidate = 600
