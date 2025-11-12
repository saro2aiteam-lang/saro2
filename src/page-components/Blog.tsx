"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Search, Calendar, User, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { blogPosts } from "@/data/blogPosts";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["All", "Templates", "Comparison"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Sora2 Blog | Sora 2 Tutorials & Guides"
        description="Get the latest tips, comparisons, and workflows for creating video with Sora 2. Dive into Sora 2 text-to-video guides and tutorials."
        canonical="https://saro2.ai/blog"
      />
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Sora2 Blog | Sora 2 Tutorials & Guides
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Latest insights, tutorials, and best practices for AI video generation with Sora2, API integration, and creative workflows
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-12">
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search articles, tutorials, guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* All Posts */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">
              {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredPosts.length} articles)
              </span>
            </h2>
            
            {filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="aspect-video relative overflow-hidden cursor-pointer">
                        <img 
                          key={post.id}
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <Badge variant="default" className="text-xs">{post.category}</Badge>
                        </div>
                      </div>
                    </Link>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="outline">{post.category}</Badge>
                        {post.featured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2 hover:text-primary cursor-pointer transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{post.publishedAt}</span>
                          </div>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                      
                      <Link href={`/blog/${post.slug}`}>
                        <Button 
                          variant="ghost" 
                          className="w-full mt-4 group"
                        >
                          Read Article
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Featured Posts */}
          {selectedCategory === "All" && searchTerm === "" && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-8 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                Featured Articles
              </h2>
              <div className="grid lg:grid-cols-2 gap-8">
                {featuredPosts.slice(0, 2).map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="aspect-video relative overflow-hidden cursor-pointer">
                        <img 
                          key={post.id}
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <Badge variant="default" className="mb-2">{post.category}</Badge>
                        </div>
                      </div>
                    </Link>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="default">{post.category}</Badge>
                        <Badge variant="secondary">Featured</Badge>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:text-primary cursor-pointer transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-1" />
                          <span className="mr-4">{post.author}</span>
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{post.publishedAt}</span>
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter Signup */}
          <Card className="mt-16 p-8 text-center bg-primary/5 border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Stay Updated with AI Video Trends</h3>
              <p className="text-muted-foreground mb-6">
                Get the latest tutorials, API updates, and best practices delivered to your inbox weekly
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input placeholder="Enter your email" className="flex-1" />
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Join 2,500+ developers and creators. Unsubscribe anytime.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
