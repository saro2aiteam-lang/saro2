"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, DollarSign, Zap, Film, Image, Share2, Sparkles } from 'lucide-react';

const KeyFeatures = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section 1: Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            What makes Saro2 AI different
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* No Watermark */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <X className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                No watermark
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your videos are clean, brandable, and ready for commercial use.
            </p>
          </Card>

          {/* Best Cost-Performance */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                Best cost-performance
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Up to 10× cheaper than other AI video tools, with generous credits.
            </p>
          </Card>

          {/* Fast & Convenient */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                Fast & convenient
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate 10-second clips within minutes — right in the browser.
            </p>
          </Card>

          {/* Sora 2 Pro Storyboard */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Film className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                Sora 2 Pro Storyboard (25 seconds)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sora 2 Storyboard storytelling for ads, trailers, product showcases, and cinematic short films.
            </p>
          </Card>

          {/* Text-to-video & Image-to-video */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                Text-to-video & image-to-video
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload an image and animate motion around it, or describe a scene in one sentence.
            </p>
          </Card>

          {/* Social-ready */}
          <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">
                Social-ready
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Perfect for TikTok, Reels, Shorts, and paid ads.
            </p>
          </Card>
        </div>

        {/* Section 4: Try Sora 2 Free */}
        <div className="text-center">
          <Card className="p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Try Sora 2 Free — No Editing Required
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start creating cinematic videos with Sora 2 AI-powered tools. Sora 2 makes video creation easy - no experience needed. Discover what Sora 2 can do for your projects. Try Sora 2 free and see why creators choose Sora 2 for AI video generation.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.pathname = '/text-to-video')}
              className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Start Generating
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
