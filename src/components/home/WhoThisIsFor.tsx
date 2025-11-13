"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, ShoppingBag, Building2, BarChart3, Video } from 'lucide-react';

const targetAudiences = [
  {
    icon: Users,
    title: "Creators & influencers",
    description: "Create engaging content without watermarks or budget constraints."
  },
  {
    icon: ShoppingBag,
    title: "Shopify & e-commerce sellers",
    description: "Generate product videos and ads that convert without expensive production costs."
  },
  {
    icon: Building2,
    title: "Small businesses with limited budget",
    description: "Professional video content at a fraction of traditional production costs."
  },
  {
    icon: BarChart3,
    title: "Marketers running A/B creative tests",
    description: "Quickly iterate and test different video concepts without breaking the bank."
  },
  {
    icon: Video,
    title: "Anyone needing clean footage without watermark branding",
    description: "Commercial-ready videos you can use anywhere, anytime."
  }
];

const WhoThisIsFor = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Who this is for
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you're a creator, marketer, or business owner, Saro2 AI helps you create professional videos without the hassle.
          </p>
        </div>

        {/* Target Audiences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targetAudiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <Card 
                key={index}
                className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {audience.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {audience.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhoThisIsFor;



