"use client";

import React from 'react';
import { Palette, Sliders, Play } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Palette,
    title: 'Enter prompt or upload image',
    description: 'Describe your video idea or upload a starting image for Sora 2-style generation.'
  },
  {
    number: '2',
    icon: Sliders,
    title: 'Choose ratio, duration or storyboard timing',
    description: 'Select aspect ratio, video duration, or configure multi-scene Sora 2-style storyboard timing.'
  },
  {
    number: '3',
    icon: Play,
    title: 'Generate & download Sora 2-style HD/4K video',
    description: 'Generate your Sora 2-style video and download in HD or 4K quality, ready for commercial use.'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How Saro Generates Sora 2-Style Videos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional AI videos with Sora 2-style generation in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Step Number Circle */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-black rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-card border-2 border-background rounded-full flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  {/* Connecting Line (except last step) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(100%+1rem)] w-full h-0.5 bg-primary/50">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-primary/50 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
