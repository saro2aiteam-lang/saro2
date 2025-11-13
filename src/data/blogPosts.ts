import { getAllBlogPosts as getAllBlogPostsFromFiles, getBlogPostBySlug as getBlogPostBySlugFromFiles, getAllBlogSlugs as getAllBlogSlugsFromFiles } from '@/lib/blog';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  image: string;
}

// Function to get all blog posts (server-side only)
// This avoids importing fs in client components
export function getAllBlogPosts(): BlogPost[] {
  return getAllBlogPostsFromFiles();
}

// Legacy export for backward compatibility (will be empty if no MD files exist)
export const blogPosts: BlogPost[] = [];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getBlogPostBySlugFromFiles(slug);
}

export function getAllBlogSlugs(): string[] {
  return getAllBlogSlugsFromFiles();
}
