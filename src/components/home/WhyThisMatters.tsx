"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, DollarSign, Layout, Clock, X, Film, Share2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

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
    description: "Sora 2 Storyboard videos require technical expertise."
  },
  {
    icon: Clock,
    title: "Slow generation",
    description: "Long wait times disrupt creative workflow and productivity."
  }
];

const keyFeatures = [
  {
    icon: X,
    title: "Sora 2-Style, No Watermark",
    description: "Clean, commercial-ready videos.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500"
  },
  {
    icon: DollarSign,
    title: "Best Cost-Performance",
    description: "Up to 10× cheaper than similar AI video tools.",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500"
  },
  {
    icon: Film,
    title: "Sora-Compatible Multi-Model Pipeline",
    description: "More stable generation + higher success rate.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500"
  },
  {
    icon: Share2,
    title: "25s Sora 2-Style Storyboard",
    description: "Sora 2 Storyboard storytelling ideal for ads.",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-500"
  }
];

const WhyThisMatters = () => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Why Creators Choose Saro for Sora 2-Style Videos
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Short-form video is exploding — but Sora 2 access is limited. Saro.ai helps creators generate Sora 2-style videos instantly using Sora-compatible and multi-model engines.
          </p>
        </div>

        {/* Two Column Layout: Challenges vs Solutions */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Pain Points Section */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-border"></div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                The Challenges
              </h3>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-border"></div>
            </div>
            <div className="grid gap-4">
              {painPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <Card 
                    key={index}
                    className="p-5 border border-border/50 hover:border-destructive/30 transition-all duration-300 hover:shadow-lg bg-card/80 backdrop-blur-sm hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                        <Icon className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold mb-1.5 text-foreground">
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

          {/* Key Features Section */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-border"></div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What Makes Saro2 AI Different
              </h3>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-border"></div>
            </div>
            <div className="grid gap-4">
              {keyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="p-5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:-translate-y-1 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold mb-1.5 text-foreground">
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

        {/* Solution Divider - Compact */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="text-base font-semibold text-foreground">
              We fix all of that with Sora 2-style generation
            </p>
            <ArrowRight className="w-4 h-4 text-primary/60" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyThisMatters;
