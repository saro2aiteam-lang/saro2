"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { promptExamples } from '@/data/promptExamples';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Hero = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState('');
  
  // Initialize examples inside component to ensure SSR/client consistency
  const getInitialExamples = (): string[] => {
    if (!promptExamples || promptExamples.length === 0) {
      return [];
    }
    const examples = promptExamples.slice(0, 20).map(p => p.prompt);
    // Duplicate for seamless scroll
    return [...examples, ...examples];
  };
  
  const [currentExamples] = useState<string[]>(() => getInitialExamples());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Set video source on client side only to avoid hydration mismatch
  useEffect(() => {
    setVideoSrc('/videos/bride.mp4');
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
        {/* Fallback background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        {videoSrc && (
          <video
            key="bride-video"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}
        {/* Gradient Overlay - 半透明黑色渐变，提升文字可读性 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-transparent"
          suppressHydrationWarning
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-center space-y-8 sm:space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Authentic Sora-Grade Quality</span>
          </div>

          {/* Main Heading Section */}
          <div className="text-center space-y-5 sm:space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white drop-shadow-[0_0_16px_rgba(0,0,0,0.3)]" suppressHydrationWarning>
              <span className="relative inline-block whitespace-nowrap">
                Sora 2-Style AI Video Generator
                <span className="absolute -top-1 -right-10 sm:-right-14 md:-right-16 text-[8px] sm:text-[10px] md:text-xs font-mono font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap tracking-wider shadow-lg animate-pulse">
                  NEW
                </span>
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-white/95 drop-shadow-[0_0_16px_rgba(0,0,0,0.3)] leading-relaxed px-4">
              No watermark • No regional limits • No invite needed • 25s multi-scene storyboards • Sora-compatible quality
            </p>
          </div>

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-white/80 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)] px-4" suppressHydrationWarning>
              Independent third-party platform using Sora-compatible and multi-model engines.  Not affiliated with OpenAI or Sora 2.
            </p>
          </div>

          {/* Input Section */}
          <div className="w-full max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow effect on focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerate();
                  }
                }}
                placeholder='Describe your video idea… (e.g. "a premium product demo with dramatic lighting")'
                className="w-full px-6 py-5 sm:py-6 text-base sm:text-lg bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all pr-24 sm:pr-80"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex gap-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
                  onClick={() => router.push('/multi-scene')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Storyboard
                </Button>
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isAuthenticated) {
                      handleGenerate();
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold px-5 sm:px-7 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {isAuthenticated ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Start Creating</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Start Creating</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          </div>

          {/* Scrolling Example Prompts */}
          <div className="relative overflow-hidden w-full max-w-6xl mx-auto mt-4 sm:mt-6">
          <div className="flex gap-3 sm:gap-4 animate-scroll">
            {currentExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="flex-shrink-0 flex items-center gap-2.5 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:border-primary/50 hover:bg-white/20 dark:hover:bg-white/10 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                <span className="text-xs sm:text-sm text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.4)] whitespace-nowrap max-w-xs truncate font-medium">
                  {example}
                </span>
              </button>
            ))}
          </div>
          
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/40 via-black/20 to-transparent pointer-events-none z-10" />
        </div>
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
