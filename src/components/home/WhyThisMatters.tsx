"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, DollarSign, Layout, X, Zap, Film, Image, Share2, Sparkles } from 'lucide-react';

const painPoints = [
  {
    icon: AlertCircle,
    title: "Heavy watermarks",
    description: "Platform logos make videos unprofessional for commercial use."
  },
  {
    icon: DollarSign,
    title: "Expensive pricing",
    description: "High costs limit frequent video creation."
  },
  {
    icon: Layout,
    title: "Complex storyboarding",
    description: "Multi-scene videos require technical expertise."
  }
];

const keyFeatures = [
  {
    icon: X,
    title: "No watermark",
    description: "Clean, brandable videos ready for commercial use."
  },
  {
    icon: DollarSign,
    title: "Best cost-performance",
    description: "Up to 10× cheaper with generous credits."
  },
  {
    icon: Zap,
    title: "Fast & convenient",
    description: "Generate 10-second clips within minutes."
  },
  {
    icon: Film,
    title: "Sora 2 Pro Storyboard",
    description: "25-second multi-scene storytelling for ads and showcases."
  },
  {
    icon: Image,
    title: "Audio synchronization",
    description: "Upload images or describe scenes in one sentence."
  },
  {
    icon: Share2,
    title: "Social-ready",
    description: "Perfect for TikTok, Reels, Shorts, and paid ads."
  }
];

const WhyThisMatters = () => {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Combined Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Why this matters & What makes Saro2 AI different
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Short-form video is exploding — but creators face real challenges. We fix all of that.
          </p>
        </div>

        {/* Pain Points Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-center mb-8 text-muted-foreground">
            The Challenges
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">
                        {point.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Solution Divider */}
        <div className="text-center mb-16">
          <div className="inline-block px-8 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full border border-primary/20">
            <p className="text-xl font-semibold text-foreground">
              We fix all of that with Sora 2 and Sora 2 Pro
            </p>
          </div>
        </div>

        {/* Key Features Section */}
        <div>
          <h3 className="text-2xl font-semibold text-center mb-8 text-muted-foreground">
            Our Solution
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyThisMatters;
