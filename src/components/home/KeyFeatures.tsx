"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Film, Camera } from 'lucide-react';

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
            Next-Generation Cinematic Video Creation
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Generate realistic motion, consistent characters, and multi-shot scenes without filming or editing skills.
          </p>
        </div>

        {/* Section 2 & 3: Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Motion Realism Card */}
          <Card className="p-8 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Film className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                Motion Realism & Scene Consistency
              </h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Physical-style scene simulation</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Smooth camera motion</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Cinematic lighting presets</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">World-state continuity</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Character persistence</span>
              </li>
            </ul>
          </Card>

          {/* Storyboard Card */}
          <Card className="p-8 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                Storyboard → Script → Camera Movements
              </h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Visual storyboard layout</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Shot-by-shot prompts</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Camera direction control</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-foreground/90 leading-relaxed">Scene transitions</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Section 4: Try Sora 2 Free */}
        <div className="text-center">
          <Card className="p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Try Sora 2 Free — No Editing Required
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start creating cinematic videos with AI-powered tools. No experience needed.
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
