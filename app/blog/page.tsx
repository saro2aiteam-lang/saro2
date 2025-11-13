import Blog from '@/page-components/Blog'
import { getAllBlogPosts } from '@/data/blogPosts'

export const metadata = {
  title: 'Sora2 Blog | Sora 2 Tutorials & Guides',
  description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2. Dive into Sora 2 text-to-video guides and tutorials.',
  keywords: 'Sora2 blog, Sora 2 tutorials, Sora 2 guide, AI video generation tips, Sora 2 insights, Sora 2 workflows, Sora 2 vs Veo, Sora 2 comparison, Sora 2 video generator',
  alternates: {
    canonical: 'https://saro2.ai/blog',
  },
  openGraph: {
    title: 'Sora2 Blog | Sora 2 Tutorials & Guides',
    description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2. Dive into Sora 2 text-to-video guides and tutorials.',
    url: 'https://saro2.ai/blog',
    siteName: 'Sora 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora2 Blog',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora2 Blog | Sora 2 Tutorials & Guides',
    description: 'Get the latest tips, comparisons, and workflows for creating video with Sora 2.',
    images: ['https://saro2.ai/logo.png']
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPage() {
  // Read blog posts on the server side
  const blogPosts = getAllBlogPosts();
  return <Blog blogPosts={blogPosts} />
}

// Cache blog index with ISR for 10 minutes
export const revalidate = 600
