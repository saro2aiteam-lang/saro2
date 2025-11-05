"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/data/blogPosts";
import BlogPostContent from "@/components/BlogPostContent";

interface BlogPostPageProps {
  post: BlogPost;
}

const BlogPostPage = ({ post }: BlogPostPageProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead 
        title={post.title}
        description={post.excerpt}
        canonical={`https://saro2.ai/blog/${post.slug}`}
      />
      <Navigation />
      
      <div className="pt-20 pb-16 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <article className="bg-white dark:bg-gray-900">
            {/* Header - Google Style */}
            <header className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Badge variant="outline" className="text-xs px-2 py-1 font-normal text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600">{post.category}</Badge>
                {post.featured && <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200">Featured</Badge>}
              </div>
              
              <h1 className="text-3xl font-normal mb-4 leading-tight tracking-normal text-gray-900 dark:text-gray-100 font-sans">
                {post.title}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed font-sans">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="font-normal text-gray-600 dark:text-gray-300">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{post.publishedAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </header>

            {/* Content - Google Style */}
            <BlogPostContent content={post.content} />

            {/* Tags - Google Style */}
            <footer className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-normal mb-3 text-gray-500 dark:text-gray-400">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </footer>

            {/* Back to Blog - Google Style */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-normal">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  View All Articles
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostPage;

