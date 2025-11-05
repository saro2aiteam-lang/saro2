"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const KeyFeatures = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section 1 */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
            Next-Generation Cinematic Video Creation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-center">
            Generate realistic motion, consistent characters, and multi-shot scenes without filming or editing skills.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Motion Realism & Scene Consistency
          </h2>
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Physical-style scene simulation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Smooth camera motion</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Cinematic lighting presets</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">World-state continuity</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Character persistence</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Storyboard → Script → Camera Movements
          </h2>
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Visual storyboard layout</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Shot-by-shot prompts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Camera direction control</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Scene transitions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 5: Try Sora 2 Free */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Try Sora 2 Free — No Editing Required
          </h2>
          <Button
            size="lg"
            onClick={() => (window.location.pathname = '/text-to-video')}
            className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Generating
          </Button>
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
