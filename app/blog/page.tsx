import Blog from '@/page-components/Blog'
import { getAllBlogPosts } from '@/data/blogPosts'

export const metadata = {
  title: 'Sora 2 Blog | Sora 2 Tutorials, Guides & Tips',
  description: 'Get the latest Sora 2 tips, tutorials, and guides. Learn how to use Sora 2, Sora 2 vs Veo comparisons, Sora 2 workflows, and Sora 2 video generation best practices. Sora 2 tutorials and guides.',
  alternates: {
    canonical: 'https://saro2.ai/blog',
  },
  openGraph: {
    title: 'Sora 2 Blog | Sora 2 Tutorials, Guides & Tips',
    description: 'Get the latest Sora 2 tips, tutorials, and guides. Learn how to use Sora 2, Sora 2 vs Veo comparisons, and Sora 2 video generation best practices. Sora 2 tutorials.',
    url: 'https://saro2.ai/blog',
    siteName: 'Saro 2',
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
    title: 'Sora 2 Blog | Sora 2 Tutorials, Guides & Tips',
    description: 'Get the latest Sora 2 tips, tutorials, and guides. Learn how to use Sora 2 and Sora 2 video generation best practices.',
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
