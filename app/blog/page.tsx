import Blog from '@/page-components/Blog'

export const metadata = {
  title: 'Sora2 Blog | Sora 2 Tutorials, Guides & AI Video Generation Insights',
  description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2. Dive into Sora 2 text-to-video guides, Sora 2 image-to-video tutorials, Sora 2 vs Veo 3 comparisons, and creative strategies.',
  keywords: 'Sora2 blog, Sora 2 tutorials, Sora 2 guide, AI video generation tips, Sora 2 insights, Sora 2 workflows, Sora 2 vs Veo, Sora 2 comparison, Sora 2 video generator',
  openGraph: {
    title: 'Sora2 Blog | Sora 2 Tutorials, Guides & AI Video Generation Insights',
    description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2. Dive into Sora 2 text-to-video guides and tutorials.',
    images: ['https://saro2.ai/logo.png'],
    type: 'website',
    url: 'https://saro2.ai/blog'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora2 Blog | Sora 2 Tutorials, Guides & AI Video Generation Insights',
    description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2.',
    images: ['https://saro2.ai/logo.png']
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
