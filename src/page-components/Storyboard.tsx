"use client";

// Twitter Widgets types
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}

import React, { useState, useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { Play, FileText, Sparkles, AlertTriangle, Layers, Smartphone, Download, Film, Target, Star, Quote, CheckCircle, Zap, Users, Clock, ImageIcon, User, Settings, LogOut, ChevronDown } from "lucide-react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GenerateSidebar from "@/components/generate/GenerateSidebar";
import VideoPreview from "@/components/generate/VideoPreview";
import useJobsPolling from "@/hooks/useJobsPolling";
import { useStoryboardPolling } from "@/hooks/useStoryboardPolling";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { StoryboardParams, StoryboardJob } from "@/types/storyboard";
import { StoryboardManager } from "@/components/storyboard/StoryboardManager";
import AuthModal from "@/components/AuthModal";
import SubscriptionRequiredModal from "@/components/SubscriptionRequiredModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const Storyboard = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { subscription, calculateCredits } = useCredits();
  const router = useRouter();
  
  // Get user display name and initials
  const getUserDisplayName = useCallback(() => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [user]);
  
  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [getUserDisplayName]);
  
  // Storyboard state
  const [storyboardParams, setStoryboardParams] = useState<StoryboardParams>({
    shots: [
      {
        prompt: 'Setting: Neon-lit city street after rain. A handsome man steps off a black motorcycle, removes his helmet. His eyes lock on a stunning woman.',
        duration: 8
      },
      {
        prompt: 'Setting: The woman raises her hand — the air ripples. The scene melts into a dream-like digital world.She and the man float in an ethereal light field, surrounded by glowing pixels.',
        duration: 8
      },
      {
        prompt: 'Back to reality. The man watches the AI-generated video on his phone. He stands on a rooftop overlooking the neon skyline. The music swells, blending dream and reality.',
        duration: 9
      }
    ],
    n_frames: "25",
    aspect_ratio: 'portrait',
    image_file: undefined
  });

  const [currentJob, setCurrentJob] = useState<StoryboardJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);

  // Load Twitter Widgets
  useEffect(() => {
    const loadTwitterWidgets = () => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    };

    // Load widgets after component mounts
    const timer = setTimeout(loadTwitterWidgets, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate credit cost based on total duration
  const getCreditCost = (n_frames: string) => {
    switch (n_frames) {
      case "10": return 250;
      case "15": return 450;
      case "25": return 450;
      default: return 250;
    }
  };
  
  const creditCost = getCreditCost(storyboardParams.n_frames);
  const userCredits = subscription?.credits || 0;

  // Job polling for status updates
  const [jobs, setJobs] = useState<StoryboardJob[]>([]);

  const handleJobUpdate = useCallback((job: StoryboardJob) => {
    setJobs(prev => {
      const existingIndex = prev.findIndex(j => j.jobId === job.jobId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = job;
        return updated;
      } else {
        return [...prev, job];
      }
    });
  }, []);

  // Use the new storyboard-specific polling hook
  const { startPolling: startStoryboardPolling } = useStoryboardPolling({
    jobs,
    onJobUpdate: handleJobUpdate
  });

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    // Check credits
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }

    // Validate form
    const newErrors: Record<string, string> = {};
    if (storyboardParams.shots.length === 0) {
      newErrors.shots = "At least one shot is required";
    }
    if (storyboardParams.shots.some(shot => !shot.prompt.trim())) {
      newErrors.prompt = "All shots must have a prompt";
    }

    // Check duration allocation
    const totalUsedDuration = storyboardParams.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const maxDuration = parseInt(storyboardParams.n_frames);
    
    if (totalUsedDuration > maxDuration) {
      newErrors.duration = `Total shot duration (${totalUsedDuration}s) exceeds maximum duration (${maxDuration}s)`;
    } else if (totalUsedDuration < maxDuration) {
      newErrors.duration = `Duration not allocated right. Total shot duration (${totalUsedDuration}s) is less than maximum duration (${maxDuration}s). Please allocate all remaining duration.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('shots', JSON.stringify(storyboardParams.shots));
      formData.append('n_frames', storyboardParams.n_frames);
      formData.append('aspect_ratio', storyboardParams.aspect_ratio);
      
      // Add image file if selected
      if (storyboardParams.image_file) {
        formData.append('image_file', storyboardParams.image_file);
      }

      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }

      const result = await response.json();
      
      // Create job object
      const newJob: StoryboardJob = {
        jobId: result.jobId,
        taskId: result.taskId || result.jobId,
        status: 'pending',
        progress: 0,
        params: storyboardParams,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: creditCost
      };

      setCurrentJob(newJob);
      setJobs(prev => [newJob, ...prev]);
      startStoryboardPolling(result.jobId);
      
    } catch (error) {
      console.error('Error generating storyboard:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate storyboard';
      
      if (errorMessage.includes('credit')) {
        setPendingCost(creditCost);
        setShowSubscriptionModal(true);
      } else {
        setErrors({ prompt: errorMessage });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isAuthenticated, user, userCredits, creditCost, storyboardParams, startStoryboardPolling]);

  // Handle job completion
  useEffect(() => {
    if (currentJob && jobs.length > 0) {
      const job = jobs.find(j => j.jobId === currentJob.jobId);
      if (job && (job.status !== currentJob.status || job.progress !== currentJob.progress)) {
        setCurrentJob(prev => prev ? { ...prev, ...job } : null);
        
        if (job.status === 'completed' || job.status === 'failed') {
          setIsGenerating(false);
        }
      }
    }
  }, [jobs]); // 只依赖 jobs，移除 currentJob

  // Handle retry
  const handleRetry = useCallback(async (job: StoryboardJob) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setErrors({});
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job.params),
      });

      if (!response.ok) {
        throw new Error('Failed to retry storyboard generation');
      }

      const result = await response.json();
      
      const newJob: StoryboardJob = {
        ...job,
        jobId: result.jobId,
        taskId: result.taskId || result.jobId,
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString(),
        error: undefined,
        creditCost: creditCost
      };

      setJobs(prev => [newJob, ...prev]);
      setCurrentJob(newJob);
      startStoryboardPolling(result.jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry job';
      setErrors({ prompt: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  }, [user, userCredits, creditCost, startStoryboardPolling]);

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead 
        title="Sora 2 Pro Storyboard | Multi-Scene Video Generator"
        description="Sora 2 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Control scenes and maintain visual consistency."
        canonical="https://saro2.ai/sora-2-storyboard"
        keywords="Sora 2 Pro Storyboard,sora 2 storyboard,AI video storyboard,multi-scene video,TikTok video generator,Instagram Reels,YouTube Shorts,AI video creator,Sora 2,storyboard generator,AI video maker,social media video creator"
        image="https://saro2.ai/og-sora2-storyboard.jpg"
      />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Sora 2 Pro Storyboard",
            "description": "Create professional multi-scene AI videos up to 25 seconds perfect for YouTube Shorts, TikTok, Instagram Reels. Design your story with scene-by-scene control and seamless transitions using Sora 2 Pro Storyboard's advanced capabilities.",
            "url": "https://saro2.ai/sora-2-storyboard",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "19",
              "priceCurrency": "USD",
              "priceSpecification": {
                "@type": "PriceSpecification",
                "price": "19",
                "priceCurrency": "USD",
                "billingIncrement": "Monthly"
              }
            },
            "creator": {
              "@type": "Organization",
              "name": "ivido",
              "url": "https://saro2.ai"
            },
            "featureList": [
              "Multi-scene video generation",
              "Scene-by-scene control",
              "Up to 25 seconds duration",
              "Social media optimization",
              "Reference image support",
              "Portrait and landscape modes"
            ],
            "screenshot": "https://saro2.ai/sora2-storyboard-screenshot.jpg",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            }
          })
        }}
      />
      <GenerateSidebar />
      
      <div className="flex-1 transition-all duration-300 pb-16 bg-background" style={{ marginLeft: 'var(--sidebar-width, 240px)' }}>
        {/* Top Right: Theme Toggle, Login and Start for Free */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-b border-border">
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-muted/50 transition-colors rounded-full px-2 py-1"
                >
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  {/* User Name */}
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {getUserDisplayName()}
                  </span>
                  {/* Dropdown Arrow */}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Login
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start for Free
              </Button>
            </>
          )}
        </div>
        
        {/* Breadcrumb Navigation */}
        <nav className="pt-8 pb-4 bg-background" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">Sora 2 Pro Storyboard</span>
            </li>
          </ol>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <h1 className="text-4xl font-bold text-foreground mb-4 text-center">
            Sora 2 Pro Storyboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-center">
            Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels — no watermark
          </p>
          
          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errors.duration || errors.prompt || errors.shots || Object.values(errors)[0]}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel: Storyboard Configuration */}
            <div className="space-y-6">
              <div className="relative bg-card border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-sm font-bold text-foreground uppercase tracking-wide">Storyboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border border-primary/20">
                      <span>Credits: {userCredits}</span>
                    </span>
                  </div>
                </div>

                <StoryboardManager
                  params={storyboardParams}
                  onParamsChange={setStoryboardParams}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  creditCost={creditCost}
                />
              </div>
            </div>

            {/* Right Panel: Output */}
            <div className="space-y-6">
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-bold text-foreground uppercase tracking-wide">Output</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border whitespace-nowrap">
                    Sora 2 Storyboard Video
                  </span>
                </div>

                {currentJob ? (
                  <>
                    {/* Generation time info */}
                    {currentJob.status === 'processing' && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Generating Storyboard...
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          ⏱️ This typically takes 5-15 minutes. Please keep this page open.
                        </p>
                      </div>
                    )}
                    
                    <VideoPreview
                    currentJob={{
                      jobId: currentJob.jobId,
                      status: currentJob.status === 'completed' ? 'SUCCEEDED' : currentJob.status === 'failed' ? 'FAILED' : currentJob.status === 'processing' ? 'RUNNING' : 'PENDING',
                      progress: currentJob.progress,
                      preview_url: currentJob.thumbnailUrl,
                      result_url: currentJob.videoUrl,
                      error: currentJob.error ? { code: 'UNKNOWN', message: currentJob.error } : undefined,
                      params: {
                        prompt: storyboardParams.shots?.[0]?.prompt || 'Storyboard video',
                        duration_sec: 16,
                        aspect_ratio: storyboardParams.aspect_ratio === 'portrait' ? '9:16' : '16:9',
                        cfg_scale: 7,
                        reference_image_url: undefined // Image will be uploaded separately
                      },
                      created_at: currentJob.created_at,
                      creditCost: currentJob.creditCost
                    }}
                    onRetry={async () => { await handleRetry(currentJob); }}
                  />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <span className="font-bold text-accent-foreground/80">Example Video</span>
                      </div>
                      <p className="text-sm text-accent-foreground/80">
                        Here's an example of a 25-second multi-scene storyboard video. Configure your scenes and click generate to create your own.
                      </p>
                    </div>
                    
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                      <video 
                        className="w-full h-full object-cover"
                        controls
                        poster=""
                        preload="metadata"
                      >
                        <source 
                          src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/storyboardexample.mp4" 
                          type="video/mp4" 
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Example: 3-scene storyboard (8s + 8s + 9s = 25s total)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature Description */}
          <section className="mt-16 mb-8">
            {/* Pricing Banner */}
            <div className="mb-12">
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                  <span className="font-bold inline-block">💎 Pricing:</span> <Link href="/plans" className="inline-block text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 underline decoration-amber-300 dark:decoration-amber-500 hover:decoration-amber-500 dark:hover:decoration-amber-300 transition-colors">Starting from $19/month for high-quality multi-scene AI videos with audio</Link>
                </p>
              </div>
            </div>

            {/* What is Sora 2 Pro Storyboard */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
                What is Sora 2 Pro Storyboard?
              </h2>
              <Card className="p-8 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="max-w-4xl mx-auto text-center">
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Sora 2 Pro Storyboard is a cutting-edge AI video generation system designed for sequential content production. 
                    Build multi-scene AI videos up to 25s for Youtube Shorts, TikTok and Reels. This robust platform enables multi-scene coordination, 
                    maintains visual consistency and coherence, provides precise control over outputs up to 25 seconds in length, and exports HD quality videos with audio.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      Up to 25s Duration
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      Multi-Scene Control (Storyboard)
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      Social Media Ready
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      HD Quality + Audio
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* X (Twitter) Showcase */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                What People Are Saying About Sora 2 Pro Storyboard
              </h2>
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sora 2 Updates Tweet */}
                  <Card className="p-4 bg-card hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        2 Sora 2 updates:<br/><br/>
                        - Storyboards are now available on web to Pro users<br/>
                        - All users can now generate videos up to 15 seconds on app and web, Pro users up to 25 seconds on web 
                        <a href="https://t.co/iINg7alWGL">pic.twitter.com/iINg7alWGL</a>
                      </p>
                      <a href="https://twitter.com/status/1978661828419822066?ref_src=twsrc%5Etfw">October 16, 2025</a>
                    </blockquote>
                  </Card>

                  {/* Dustin Hollywood Tweet */}
                  <Card className="p-4 bg-card hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        SORA Update!!! IT'S HUGE!! THE STORYBOARD!!!<br/><br/>
                        This is the way..<br/><br/>
                        - NEW UI<br/>
                        - Unlimited Scene Planning<br/>
                        - Scene time allotment (custom timing)<br/>
                        - An increase in Pro to 25-Seconds!<br/>
                        - Start frame redesign!<br/>
                        - Better scene/shot transition designing now<br/><br/>
                        Go on the web to SORA, click… 
                        <a href="https://t.co/d040XEE0FS">pic.twitter.com/d040XEE0FS</a>
                      </p>
                      &mdash; Dustin Hollywood (@dustinhollywood) 
                      <a href="https://twitter.com/dustinhollywood/status/1978545835978703340?ref_src=twsrc%5Etfw">October 15, 2025</a>
                    </blockquote>
                  </Card>

                  {/* Cody Baker Tweet */}
                  <Card className="p-4 bg-card hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        Here's an example of a 25s video I made in Sora 2 using the new storyboard feature.<br/><br/>
                        Still learning what's the best way to use this… 
                        <a href="https://t.co/urYyCy3gqz">pic.twitter.com/urYyCy3gqz</a>
                      </p>
                      &mdash; Cody Baker 🇺🇸 (@CodyBaker_xx) 
                      <a href="https://twitter.com/CodyBaker_xx/status/1978813530292851188?ref_src=twsrc%5Etfw">October 16, 2025</a>
                    </blockquote>
                  </Card>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                Key Features of Sora 2 Pro Storyboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Multi-Scene Sequencing</h3>
                      <p className="text-muted-foreground">
                        With Sora 2 Pro Storyboard, define multiple scenes in order to create coherent storylines. 
                        The Sora 2 Pro Storyboard engine ensures smooth transitions between scenes for seamless multi-scene videos.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Visual Consistency</h3>
                      <p className="text-muted-foreground">
                        Sora 2 Pro Storyboard maintains consistent visual style and elements across all scenes, 
                        delivering professional-quality video output that viewers expect from Sora 2 Pro Storyboard.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Flexible Output Control</h3>
                      <p className="text-muted-foreground">
                        Generate videos up to 25 seconds with Sora 2 Pro Storyboard. Choose 10s, 15s, or 25s 
                        duration options to fit your content needs using Sora 2 Pro Storyboard.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Reference Image Support</h3>
                      <p className="text-muted-foreground">
                        Upload a reference image to guide the Sora 2 Pro Storyboard generation process, 
                        ensuring visual consistency throughout your Sora 2 Storyboard video.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* How to Use */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                How to Use Sora 2 Pro Storyboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Define Scenes</h3>
                  <p className="text-muted-foreground text-sm">
                    Describe each scene in detail for Sora 2 Pro Storyboard
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Set Parameters</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose duration (10s/15s/25s) and aspect ratio
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Upload Reference</h3>
                  <p className="text-muted-foreground text-sm">
                    Add an image to guide Sora 2 Pro Storyboard (Optional)
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">4</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Generate</h3>
                  <p className="text-muted-foreground text-sm">
                    Click generate and let Sora 2 Pro Storyboard create your video
                  </p>
                </Card>
              </div>
              
              <div className="mt-8 text-center">
                <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-muted-foreground">
                    Perfect for TikTok, Instagram Reels, YouTube Shorts, 
                    and brand content creation. Learn more about our <Link href="/plans" className="text-primary hover:underline">pricing plans</Link>.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Powerful Storyboard Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                <Layers className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Scene-by-Scene Control</h3>
                <p className="text-muted-foreground">Drag & drop scenes, customize prompts & assets for perfect flow.</p>
              </Card>
              <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                <Smartphone className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Social Media Formats</h3>
                <p className="text-muted-foreground">Built-in templates for TikTok, Instagram Reels, YouTube Shorts.</p>
              </Card>
              <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                <Download className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Fast Export & Share</h3>
                <p className="text-muted-foreground">Generate, preview and download your Sora 2 Storyboard videos in minutes.</p>
              </Card>
            </div>
          </section>

          {/* Sora 2 Pro Storyboard Application */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              <span suppressHydrationWarning>Sora 2 Pro Storyboard Application</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Sora 2 Storyboard AI Videos</h3>
                    <p className="text-muted-foreground">
                      Sora 2 Pro Storyboard API lets you design complete multi-scene video flows where every shot follows your creative vision. 
                      You define each scene's visuals and pacing using text or image prompts, while the API ensures natural transitions 
                      and consistent visual style throughout the video.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Cinematic Ads & Storytelling</h3>
                    <p className="text-muted-foreground">
                      The API helps brands and creators structure professional-grade short films or ad visuals. 
                      You can plan camera movements, transitions, and tone precisely, producing cinematic ads 
                      that clearly express your brand's story and aesthetic identity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Concept Videos & Prototypes</h3>
                    <p className="text-muted-foreground">
                      Yes. It's ideal for turning creative concepts into structured visual prototypes. 
                      Each scene becomes part of a connected flow, allowing you to test how storylines, 
                      pacing, and compositions work together before moving into full-scale production.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Character-Driven Animation</h3>
                    <p className="text-muted-foreground">
                      You can maintain the same characters, environments, and tone across different shots to produce 
                      cohesive narrative sequences. This is especially useful for storytelling videos, product explainers, 
                      or social clips that depend on emotional and visual continuity.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Creator Stories */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              What Creators Are Saying
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"Sora 2 Pro Storyboard transformed my content creation. My engagement has skyrocketed!"</p>
                <p className="font-semibold text-foreground">- Sarah Chen <span className="text-sm text-muted-foreground">(@sarahcreates)</span></p>
                <p className="text-sm text-green-500 mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> +300% Engagement</p>
              </Card>
              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"The scene-by-scene control is a game-changer. I can now tell complex stories with ease."</p>
                <p className="font-semibold text-foreground">- Marcus Johnson <span className="text-sm text-muted-foreground">(@marcusvlogs)</span></p>
                <p className="text-sm text-green-500 mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> +150% Watch Time</p>
              </Card>
              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"Finally, an AI tool that understands visual consistency across multiple shots. My clients love it!"</p>
                <p className="font-semibold text-foreground">- Elena Rodriguez <span className="text-sm text-muted-foreground">(@elenabrand)</span></p>
                <p className="text-sm text-green-500 mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> 100% Client Satisfaction</p>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-4">
              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How can Sora 2 Pro Storyboard API help in creating multi-scene AI videos?
                    </h3>
                    <p className="text-muted-foreground">
                      Sora 2 Pro Storyboard API lets you design complete Sora 2 Storyboard video flows where every shot follows your creative vision. 
                      You define each scene's visuals and pacing using text or image prompts, while the API ensures natural transitions 
                      and consistent visual style throughout the video.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How can brands use Sora 2 Pro Storyboard API for cinematic ads and storytelling?
                    </h3>
                    <p className="text-muted-foreground">
                      The API helps brands and creators structure professional-grade short films or ad visuals. 
                      You can plan camera movements, transitions, and tone precisely, producing cinematic ads 
                      that clearly express your brand's story and aesthetic identity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Can Sora 2 Pro Storyboard API be used for concept videos or visual prototypes?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes. It's ideal for turning creative concepts into structured visual prototypes. 
                      Each scene becomes part of a connected flow, allowing you to test how storylines, 
                      pacing, and compositions work together before moving into full-scale production.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How does Sora 2 Pro Storyboard API enable character-driven animation sequences?
                    </h3>
                    <p className="text-muted-foreground">
                      You can maintain the same characters, environments, and tone across different shots to produce 
                      cohesive narrative sequences. This is especially useful for storytelling videos, product explainers, 
                      or social clips that depend on emotional and visual continuity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      What video durations are supported by Sora 2 Pro Storyboard?
                    </h3>
                    <p className="text-muted-foreground">
                      Sora 2 Pro Storyboard costs 250 credits per 10-second video and 450 credits per 15–25 second video. 
                      You can distribute the total duration across multiple scenes as needed.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Can I upload reference images for Sora 2 Pro Storyboard generation?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes, you can upload a reference image to guide the Sora 2 Pro Storyboard generation process. 
                      This helps ensure visual consistency throughout your Sora 2 Storyboard video. The image is applied globally 
                      to all scenes in your storyboard.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>


          {/* Mobile: Fixed Generate Button */}
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
            <button
              className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-all duration-200 backdrop-blur-sm"
              onClick={handleGenerate}
              disabled={isGenerating || userCredits < creditCost}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent flex-shrink-0" />
                  <span className="whitespace-nowrap">Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current flex-shrink-0" />
                  <span className="whitespace-nowrap">Generate Storyboard</span>
                </>
              )}
            </button>
            
            {/* Generation time hint */}
            {isGenerating && (
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  ⏱️ Storyboard generation typically takes 5-15 minutes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please keep this page open while generating
                </p>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="generate videos"
      />
      
      {/* Twitter Widgets Script */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load();
          }
        }}
      />
    </div>
  );
};

export default Storyboard;