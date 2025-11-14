import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPost } from '@/data/blogPosts';

const blogDirectory = path.join(process.cwd(), 'content/blog');

/**
 * Get all blog posts from markdown files
 */
export function getAllBlogPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(blogDirectory)) {
      console.warn(`Blog directory not found: ${blogDirectory}`);
      return [];
    }

    const fileNames = fs.readdirSync(blogDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        return getBlogPostBySlug(slug);
      })
      .filter((post): post is BlogPost => post !== undefined)
      .sort((a, b) => {
        // Sort by publishedAt date, newest first
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

    return allPostsData;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  try {
    const fullPath = path.join(blogDirectory, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return undefined;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Validate required fields
    if (!data.slug || !data.title || !data.excerpt) {
      console.warn(`Blog post ${slug} is missing required fields`);
      return undefined;
    }

    // Generate id from slug (for backward compatibility)
    // Use a simple hash or index
    const id = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      id,
      slug: data.slug || slug,
      title: data.title,
      excerpt: data.excerpt,
      content: content.trim(),
      author: data.author || 'Sora2 Team',
      publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
      readTime: data.readTime || '5 min read',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured: data.featured === true,
      image: data.image || '',
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return undefined;
  }
}

/**
 * Get all blog post slugs
 */
export function getAllBlogSlugs(): string[] {
  try {
    if (!fs.existsSync(blogDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(blogDirectory);
    return fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => fileName.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error reading blog slugs:', error);
    return [];
  }
}




