import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import OptimizedVideo from '@/components/OptimizedVideo';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Play, 
  Download, 
  Share2, 
  RotateCcw, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Job } from '@/types/jobs';
import Link from 'next/link';

interface VideoPreviewProps {
  currentJob?: Job;
  onRetry?: (job: Job) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  currentJob,
  onRetry
}) => {
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { canDownload } = useSubscription();

  // AI work status subtitles that rotate every 10 seconds
  const aiWorkSubtitles = useMemo(
    () => [
      "🎬 Writing your opening scene…",
      "🎨 Painting background details…",
      "🎙️ Recording the narrator's voice…",
      "🔊 Adding background soundscape…",
      "🚀 Syncing everything together…"
    ],
    []
  );

  // Rotate subtitles every 10 seconds while a job is active
  useEffect(() => {
    if (!currentJob || currentJob.status === 'SUCCEEDED' || currentJob.status === 'FAILED') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % aiWorkSubtitles.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentJob, aiWorkSubtitles.length]);

  // 如果没有 currentJob，显示默认状态
  if (!currentJob) {
    return (
      <Card className="aspect-video flex items-center justify-center bg-muted border-border">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Ready to Generate
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your prompt and click Generate to create your video
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleDownload = () => {
    if (!canDownload) {
      setShowSubscriptionModal(true);
      return;
    }

    if (currentJob?.result_url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = currentJob.result_url;
      link.download = `video-${currentJob.jobId}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (currentJob?.result_url) {
      navigator.clipboard.writeText(currentJob.result_url);
      // Toast notification would go here
    }
  };

  // Get personality-driven progress message based on elapsed time (extended for image-to-video)
  const getProgressMessage = (elapsedSeconds: number) => {
    if (elapsedSeconds < 30) return "🎬 Analyzing your image and planning motion…";
    if (elapsedSeconds < 60) return "🧠 Understanding scene dynamics and physics…";
    if (elapsedSeconds < 90) return "🎥 Generating smooth motion and transitions…";
    if (elapsedSeconds < 120) return "🎧 Adding realistic lighting and shadows…";
    if (elapsedSeconds < 180) return "🚀 Finalizing your animated masterpiece!";
    if (elapsedSeconds < 240) return "⏳ Almost there, adding final touches…";
    return "🔄 Processing your video, please be patient…";
  };

  // Get encouraging time message (extended for image-to-video)
  const getTimeMessage = (elapsedSeconds: number) => {
    const remainingSeconds = Math.max(0, 240 - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    
    if (remainingSeconds > 120) {
      return `✨ About ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} left to animate your image`;
    } else if (remainingSeconds > 60) {
      return "🌟 Almost there — your AI animator is working hard!";
    } else if (remainingSeconds > 30) {
      return "🚀 Final touches — your animated masterpiece is almost ready!";
    } else if (remainingSeconds > 0) {
      return "⏳ Adding final details to your video…";
    } else {
      return "🔄 Processing your video, please be patient…";
    }
  };

  // Processing state with enhanced personality-driven progress
  if (currentJob.status === 'PENDING' || currentJob.status === 'QUEUED' || currentJob.status === 'RUNNING') {
    const createdTime = currentJob.created_at ? new Date(currentJob.created_at).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);
    
    // 240-second uniform distribution for image-to-video (40 seconds per phase)
    let phaseProgress = 0;
    if (elapsedSeconds < 40) {
      phaseProgress = Math.min(20, (elapsedSeconds / 40) * 20);
    } else if (elapsedSeconds < 80) {
      phaseProgress = 20 + ((elapsedSeconds - 40) / 40) * 20;
    } else if (elapsedSeconds < 120) {
      phaseProgress = 40 + ((elapsedSeconds - 80) / 40) * 20;
    } else if (elapsedSeconds < 160) {
      phaseProgress = 60 + ((elapsedSeconds - 120) / 40) * 20;
    } else if (elapsedSeconds < 200) {
      phaseProgress = 80 + ((elapsedSeconds - 160) / 40) * 20;
    } else if (elapsedSeconds < 240) {
      phaseProgress = 90 + ((elapsedSeconds - 200) / 40) * 5;
    } else {
      phaseProgress = Math.min(95, 95); // 最多显示95%，直到真正完成
    }
    
    // Use server progress if available and higher than phase progress
    const serverProgress = currentJob.progress > 0 ? currentJob.progress : 0;
    const finalProgress = Math.max(phaseProgress, serverProgress);
    
    // Only show 100% when we actually have a result URL
    const displayProgress = currentJob.result_url ? 100 : Math.min(finalProgress, 95);
    
    const progressMessage = getProgressMessage(elapsedSeconds);
    const timeMessage = getTimeMessage(elapsedSeconds);
    const progressLabel = `${Math.round(displayProgress)}% complete`;

    return (
      <Card className="min-h-[500px] flex items-center justify-center bg-primary/5 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-particle-float" />
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent/30 rounded-full animate-particle-float delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary/25 rounded-full animate-particle-float delay-2000" />
        </div>
        
        <div className="relative z-10 text-center space-y-5 p-6 max-w-lg mx-auto w-full">
          {/* Enhanced status icon with breathing animation */}
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary animate-spin" />
            </div>
          </div>
          
          {/* Main progress message */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-foreground animate-fade-in">
              {progressMessage}
            </h3>
            
            {/* Enhanced progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span className="text-primary">{progressLabel}</span>
              </div>
              <div className="relative">
                <Progress 
                  value={displayProgress} 
                  className="w-full h-3 bg-secondary/50"
                />
                {/* Glowing effect on progress bar */}
                <div 
                  className="absolute top-0 left-0 h-3 bg-primary rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
            
            {/* Dynamic AI work subtitle */}
            <div className="min-h-[2rem] flex items-center justify-center">
              <p className="text-sm text-muted-foreground animate-fade-in transition-all duration-500">
                {aiWorkSubtitles[currentSubtitle]}
              </p>
            </div>
            
            {/* Encouraging time message */}
            <p className="text-sm text-primary font-medium animate-fade-in">
              {timeMessage}
            </p>
          </div>
          
          {/* Job params summary */}
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>{currentJob.params.duration_sec}s</span>
            <span>{currentJob.params.aspect_ratio}</span>
            <span>{currentJob.creditCost ?? 0} credits</span>
          </div>
          
          {/* Brand emotional tagline */}
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">
              Made with ❤️ by Sora2 — where AI meets imagination
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hang tight, your masterpiece is on its way 🌈
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              ⏱️ Average generation time: 150s — Please be patient for high-quality results
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Success state - show video
  console.log('🎬 VideoPreview render:', {
    status: currentJob?.status,
    hasResultUrl: !!currentJob?.result_url,
    resultUrl: currentJob?.result_url,
    progress: currentJob?.progress,
    willShowVideo: currentJob?.status === 'SUCCEEDED' && !!currentJob?.result_url,
    fullJob: currentJob
  });
  
  if (currentJob.status === 'SUCCEEDED') {
    // Inject VideoObject JSON-LD for SEO when video is ready
    const videoJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: currentJob.params?.prompt?.slice(0, 80) || 'AI generated video',
      description: currentJob.params?.prompt || 'AI generated video by Sora2',
      thumbnailUrl: currentJob.preview_url ? [currentJob.preview_url] : undefined,
      uploadDate: new Date(currentJob.updated_at || Date.now()).toISOString(),
      duration: currentJob.params?.duration_sec
        ? `PT${Math.max(1, Math.round(currentJob.params.duration_sec))}S`
        : undefined,
      contentUrl: currentJob.result_url,
      embedUrl: currentJob.result_url,
      inLanguage: 'en',
      publisher: {
        '@type': 'Organization',
        name: 'Sora2',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ivido.ai/icon.png',
        },
      },
    };

    return (
      <>
        <div className="space-y-4">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
          />
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
            {currentJob.result_url ? (
              <OptimizedVideo
                src={currentJob.result_url}
                poster={currentJob.preview_url}
                controls
                preload="metadata"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Generated video error:', e);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Video Generated Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your video is ready. The video URL will be available shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-input text-foreground hover:bg-muted"
              onClick={handleDownload}
              disabled={!currentJob.result_url}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-input text-foreground hover:bg-muted"
              >
                View full history
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Required Modal */}
        <SubscriptionRequiredModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          feature="download videos"
        />
      </>
    );
  }

  // Failed state
  if (currentJob.status === 'FAILED') {
    return (
      <Card className="aspect-video flex items-center justify-center bg-destructive/5 border-destructive/20">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">Generation Failed</h3>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground max-w-xs">
              {currentJob.error?.message || 'An error occurred during video generation'}
            </p>
            {currentJob.error?.code && (
              <p className="text-xs text-foreground/70 dark:text-muted-foreground">
                Error Code: {currentJob.error.code}
              </p>
            )}
            <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              ✓ Credits have been refunded to your account
            </div>
          </div>
          
          {onRetry && (
            <Button onClick={() => onRetry(currentJob)} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Canceled state
  return (
    <>
      <Card className="aspect-video flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Generation Canceled</h3>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground">
              This generation was canceled
            </p>
          </div>
        </div>
      </Card>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="download videos"
      />
    </>
  );
};

export default VideoPreview;
