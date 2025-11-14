"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { promptExamples } from '@/data/promptExamples';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Hero = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [mounted, setMounted] = useState(false);
  
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
  
  // Demo experience states - fixed default prompt
  const DEFAULT_DEMO_PROMPT = 'A high-speed sports car running along highway at sunset';
  const [demoPrompt] = useState(DEFAULT_DEMO_PROMPT);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const DEMO_VIDEO_PATH = '/videos/running car.mp4';

  // Set video source and mounted state on client side only to avoid hydration mismatch
  useEffect(() => {
    setVideoSrc('/videos/bride.mp4');
    setMounted(true);
  }, []);

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/text-to-video?prompt=${encodeURIComponent(prompt.trim())}`);
    } else {
      router.push('/text-to-video');
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    // Demo prompt is now fixed, this function is kept for compatibility but does nothing
    // The example clicks will still work for the main prompt input if needed
  };

  const handleGenerateDemo = () => {
    // Always allow demo generation, even without prompt
    // Reset previous demo if exists
    setShowDemoVideo(false);
    setIsGeneratingDemo(true);
    
    // Simulate generation delay (1.5-2 seconds)
    setTimeout(() => {
      setIsGeneratingDemo(false);
      setShowDemoVideo(true);
    }, 1800);
  };

  const handleDemoExampleClick = (examplePrompt: string) => {
    // Demo prompt is now fixed, this function is kept for compatibility but does nothing
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
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-normal text-white/95 drop-shadow-[0_0_16px_rgba(0,0,0,0.3)] leading-relaxed px-4" suppressHydrationWarning>
              No watermark • No regional limits • No invite code needed • 25s Sora 2 Storyboard • Sora-compatible quality
            </p>
          </div>

          {/* CTA Buttons Section */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (mounted && isAuthenticated) {
                    handleGenerate();
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                {/* Always render User icon initially to match SSR, then update after mount */}
                {!mounted || !isAuthenticated ? (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    <span>Start Creating</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    <span>Start Creating</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/sora-2-storyboard')}
                className="w-full sm:w-auto rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 text-white font-semibold px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                <span>Storyboard</span>
              </Button>
            </div>
          </div>

          {/* Demo Experience Section */}
          <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8">
            <p className="text-center text-sm sm:text-base text-white/80 mb-4 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]">
              Or try a quick demo first 👇
            </p>
            
            <div className="relative group">
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                <input
                  type="text"
                  value={demoPrompt}
                  readOnly
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGeneratingDemo) {
                      handleGenerateDemo();
                    }
                  }}
                  placeholder="a futuristic cyberpunk city at night"
                  disabled={isGeneratingDemo}
                  className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all pr-28 sm:pr-32 disabled:opacity-50 cursor-default"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  {isGeneratingDemo ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-full border border-white/20 text-white">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="hidden sm:inline">Generating with Sora 2...</span>
                      <span className="sm:hidden">Generating...</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleGenerateDemo}
                      disabled={isGeneratingDemo}
                      className="rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium px-4 sm:px-5 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      <span>Generate Demo</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Demo Video Result */}
            {showDemoVideo && (
              <div className="mt-6 animate-fade-in">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm border border-white/20">
                  <video
                    src={encodeURI(DEMO_VIDEO_PATH)}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto max-h-[60vh] object-contain"
                  >
                    <source src={encodeURI(DEMO_VIDEO_PATH)} type="video/mp4" />
                  </video>
                </div>
              </div>
            )}
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

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto text-center mt-8 sm:mt-10 mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm text-white/80 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)] px-4" suppressHydrationWarning>
              Independent third-party platform using Sora-compatible and multi-model engines.  Not affiliated with OpenAI or Sora 2.
            </p>
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
