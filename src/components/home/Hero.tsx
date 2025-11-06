"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { promptExamples } from '@/data/promptExamples';
import AuthModal from '@/components/AuthModal';

const Hero = () => {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [currentExamples, setCurrentExamples] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize with example prompts
  useEffect(() => {
    const examples = promptExamples.slice(0, 20).map(p => p.prompt);
    // Duplicate for seamless scroll
    setCurrentExamples([...examples, ...examples]);
  }, []);

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/text-to-video?prompt=${encodeURIComponent(prompt.trim())}`);
    } else {
      router.push('/text-to-video');
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24" style={{ paddingTop: 'calc(6rem + var(--banner-height, 0px))' }}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      </div>
      
      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
            <div className="text-foreground" suppressHydrationWarning>
              Sora 2
            </div>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Simply turn text prompts or image into cinematic videos. High-consistency scenes, smooth motion, and creative storytelling. No filming required.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGenerate();
                }
              }}
              placeholder="Type your idea and watch it come to life in minutes"
              className="w-full px-6 py-5 sm:py-6 text-base sm:text-lg rounded-2xl border-2 border-border bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-40 sm:pr-48"
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hidden sm:flex"
                onClick={() => router.push('/multi-scene')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Storyboard
              </Button>
              <Button
                size="lg"
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 sm:px-6 text-sm sm:text-base"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Scrolling Example Prompts */}
        <div className="relative overflow-hidden mb-12">
          <div className="flex gap-4 animate-scroll">
            {currentExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 hover:bg-card transition-all cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm text-foreground whitespace-nowrap max-w-xs truncate">
                  {example}
                </span>
              </button>
            ))}
          </div>
          
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => router.push('/text-to-video')}
            className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Creating
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  );
};

export default Hero;
