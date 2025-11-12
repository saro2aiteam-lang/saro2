"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Play, AlertTriangle, Sparkles, Film, Wand2, Music2, Eye, Users, Zap, GraduationCap, Rocket, Palette, Quote, ImageIcon, Upload } from "lucide-react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GenerateSidebar from "@/components/generate/GenerateSidebar";
import VideoPreview from "@/components/generate/VideoPreview";
import useJobsPolling from "@/hooks/useJobsPolling";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { useSubscription } from "@/hooks/useSubscription";
// removed subscription gating; rely on credits-only gating
import { Job, CreateJobRequest, FormErrors, Duration } from "@/types/jobs";
import watermarkApi from "@/services/watermarkApi";
import InsufficientCreditsDialog from "@/components/insufficient-credits-dialog";
import { Sora2Mode } from "@/components/generate/modes/sora2mode";
import { ReframeMode } from "@/components/generate/modes/ReframeMode";
import { Veo3Mode } from "@/components/generate/modes/Veo3Mode";
import { Veo3ImageMode } from "@/components/generate/modes/Veo3ImageMode";
import { GenerationMode, ModeParams, Sora2Params, ReframeParams, Veo3Params } from "@/types/generation-modes";
import videoApi from "@/services/videoApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { getRandomSampleVideo, type SampleVideo } from "@/data/sampleVideos";
import SubscriptionRequiredModal from "@/components/SubscriptionRequiredModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

const createDefaultSora2Params = (): Sora2Params => ({
  prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
  negative_prompt: '',
  duration: 8,
  aspectRatio: '16:9',
  style: 'realistic',
  model: 'sora2'
});

const createDefaultReframeParams = (): ReframeParams => ({
  prompt: '',
  targetAspectRatio: '16:9',
  style: 'zoom',
  speed: 'normal',
  model: 'sora2',
  veo3SubModel: 'veo3_fast' // Default to fast for image-to-video
});

const createDefaultVeo3Params = (): Veo3Params => ({
  prompt: 'A dog playing in a park',
  model: 'veo3_fast',
  generationType: 'TEXT_2_VIDEO',
  aspectRatio: '16:9',
  enableTranslation: true
});

const Generate = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { subscription, calculateCredits } = useCredits();
  const { hasActiveSubscription } = useSubscription();
  
  // Sample video state
  const [sampleVideo, setSampleVideo] = useState<SampleVideo | null>(null);
  const [showingSample, setShowingSample] = useState(false);
  
  // Mode state
  const [generationMode, setGenerationMode] = useState<GenerationMode>('sora2');
  const [modeParams, setModeParamsState] = useState<ModeParams>(() => ({
    mode: 'sora2',
    params: createDefaultSora2Params()
  }));
  const sora2ParamsCache = useRef<Sora2Params>(
    modeParams.mode === 'sora2'
      ? (modeParams.params as Sora2Params)
      : createDefaultSora2Params()
  );
  const reframeParamsCache = useRef<ReframeParams>(
    modeParams.mode === 'reframe'
      ? (modeParams.params as ReframeParams)
      : createDefaultReframeParams()
  );
  const veo3ParamsCache = useRef<Veo3Params>(
    modeParams.mode === 'veo3'
      ? (modeParams.params as Veo3Params)
      : createDefaultVeo3Params()
  );
  const setModeParams = useCallback(
    (value: ModeParams | ((prev: ModeParams) => ModeParams)) => {
      setModeParamsState(prev => {
        const next =
          typeof value === 'function'
            ? (value as (prev: ModeParams) => ModeParams)(prev)
            : value;

        if (next.mode === 'sora2') {
          sora2ParamsCache.current = next.params as Sora2Params;
        } else if (next.mode === 'reframe') {
          reframeParamsCache.current = next.params as ReframeParams;
        } else if (next.mode === 'veo3') {
          veo3ParamsCache.current = next.params as Veo3Params;
        }

        return next;
      });
    },
    [setModeParamsState]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user display name and initials
  const getUserDisplayName = useCallback(() => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [getUserDisplayName]);

  const routeFromMode = useCallback((mode: GenerationMode) => (
    mode === 'reframe' ? '/image-to-video' : '/text-to-video'
  ), []);

  const modeFromPathname = useCallback((path: string): GenerationMode => (
    path?.startsWith('/image-to-video') ? 'reframe' : 'sora2'
  ), []);

  const handleModeChange = useCallback(
    (mode: GenerationMode) => {
      setModeParams(prev => {
        if (prev.mode === mode) {
          return prev;
        }

        if (prev.mode === 'sora2') {
          sora2ParamsCache.current = prev.params as Sora2Params;
        } else {
          reframeParamsCache.current = prev.params as ReframeParams;
        }

        const nextParams =
          mode === 'sora2'
            ? sora2ParamsCache.current
            : reframeParamsCache.current;
        if (mode === 'sora2') {
          return {
            mode: 'sora2',
            params: { ...(nextParams as Sora2Params) }
          } as ModeParams;
        }
        return {
          mode: 'reframe',
          params: { ...(nextParams as ReframeParams) }
        } as ModeParams;
      });

      setGenerationMode(mode);
      // avoid redundant push to prevent history spam
      const target = routeFromMode(mode);
      if (pathname !== target) {
        router.push(target);
      }
    },
    [setModeParams, setGenerationMode, router, pathname, routeFromMode]
  );
  const handleSora2ParamsChange = useCallback(
    (params: Sora2Params) => {
      sora2ParamsCache.current = params;
      
      // If model is veo3.1, switch to veo3 mode
      if (params.model === 'veo3.1') {
        const veo3Params: Veo3Params = {
          prompt: params.prompt,
          model: 'veo3_fast',
          generationType: 'TEXT_2_VIDEO',
          aspectRatio: params.aspectRatio === '16:9' ? '16:9' : params.aspectRatio === '9:16' ? '9:16' : '16:9',
          enableTranslation: true
        };
        veo3ParamsCache.current = veo3Params;
        setModeParams({ mode: 'veo3', params: veo3Params });
      } else {
        setModeParams({ mode: 'sora2', params });
      }
    },
    [setModeParams]
  );
  const handleReframeParamsChange = useCallback(
    (params: ReframeParams) => {
      reframeParamsCache.current = params;
      
      // If model is changed to veo3.1, keep in reframe mode but use Veo3ImageMode
      // If model is changed to sora2, update the model
      if (params.model === 'veo3.1') {
        setModeParams({ mode: 'reframe', params });
      } else {
        setModeParams({ mode: 'reframe', params });
      }
    },
    [setModeParams]
  );
  
  // Handle model change from Veo3Mode or Veo3ImageMode
  const handleModelChange = useCallback(
    (model: 'sora2' | 'veo3.1') => {
      if (model === 'veo3.1') {
        // Already in veo3 mode, do nothing
        return;
      } else if (model === 'sora2') {
        // Switch to sora2 mode
        const sora2Params: Sora2Params = {
          prompt: modeParams.mode === 'veo3' 
            ? (modeParams.params as Veo3Params).prompt 
            : modeParams.mode === 'reframe'
            ? (modeParams.params as ReframeParams).prompt || ''
            : '',
          aspectRatio: modeParams.mode === 'veo3'
            ? (modeParams.params as Veo3Params).aspectRatio === 'Auto' ? '16:9' : (modeParams.params as Veo3Params).aspectRatio
            : modeParams.mode === 'reframe'
            ? (modeParams.params as ReframeParams).targetAspectRatio === 'Auto' ? '16:9' : (modeParams.params as ReframeParams).targetAspectRatio
            : '16:9',
          duration: 8,
          model: 'sora2'
        };
        sora2ParamsCache.current = sora2Params;
        setModeParams({ mode: 'sora2', params: sora2Params });
      }
    },
    [modeParams, setModeParams]
  );
  const handleVeo3ParamsChange = useCallback(
    (params: Veo3Params) => {
      veo3ParamsCache.current = params;
      setModeParams({ mode: 'veo3', params });
    },
    [setModeParams]
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);
  
  // Job management state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  // subscription modal removed for generation gating
  
  // Watermark remover state
  const [videoUrl, setVideoUrl] = useState('https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f');
  const [outputUrl, setOutputUrl] = useState<string | undefined>(undefined);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [watermarkError, setWatermarkError] = useState<string | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  const userCredits = subscription?.credits || 0;
  
  const isValid = useMemo(() => /^https:\/\/sora\.chatgpt\.com\//.test(videoUrl.trim()), [videoUrl]);

  // Load sample video on mount for all users
  // Also check for prompt from URL query parameter
  useEffect(() => {
    const sample = getRandomSampleVideo();
    setSampleVideo(sample);
    // Always show sample video for all users
    setShowingSample(true);
    
    // Check if prompt is provided in URL
    const urlPrompt = searchParams?.get('prompt');
    
    // Pre-fill the prompt with URL parameter if available, otherwise use sample
    setModeParams(prev => {
      if (prev.mode === 'sora2') {
        return {
          mode: 'sora2',
          params: {
            ...prev.params,
            prompt: urlPrompt ? decodeURIComponent(urlPrompt) : sample.prompt,
            aspectRatio: sample.aspectRatio,
            duration: sample.duration
          }
        };
      }
      return prev;
    });
    
    // Clean up URL parameter after reading
    if (urlPrompt) {
      const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
      newSearchParams.delete('prompt');
      const newUrl = newSearchParams.toString() 
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  }, [setModeParams, searchParams, pathname, router]);

  // Polling for job updates
  const onJobUpdate = useCallback((updatedJob: Job) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.jobId === updatedJob.jobId ? updatedJob : job
      )
    );
    
    // Update current job if it's the one being updated
    if (currentJob && currentJob.jobId === updatedJob.jobId) {
      setCurrentJob(updatedJob);
    }
  }, [currentJob]);

  const { startPolling } = useJobsPolling({
    jobs,
    onJobUpdate
  });

  // Load jobs on mount (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    const loadJobs = async () => {
      try {
        // Only load recent jobs to reduce polling overhead
        const existingJobs = await videoApi.getJobs(5);
        setJobs(existingJobs);
        console.log(`[GENERATE] Loaded ${existingJobs.length} recent jobs`);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      }
    };
    
    loadJobs();
  }, [isAuthenticated, user]);

  // Form validation
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    
    switch (modeParams.mode) {
      case 'veo3': {
        const params = modeParams.params;
        if (!params.prompt?.trim()) {
          newErrors.prompt = "Prompt cannot be empty";
        }
        
        // Validate imageUrls based on generationType
        if (params.generationType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && (!params.imageUrls || params.imageUrls.length === 0)) {
          newErrors.reference_image = "At least 1 image URL is required for First and Last Frames mode";
        } else if (params.generationType === 'REFERENCE_2_VIDEO' && (!params.imageUrls || params.imageUrls.length === 0)) {
          newErrors.reference_image = "At least 1 image URL is required for Reference mode";
        }
        
        // REFERENCE_2_VIDEO only supports Fast model and 16:9
        if (params.generationType === 'REFERENCE_2_VIDEO') {
          if (params.model !== 'veo3_fast') {
            newErrors.prompt = "REFERENCE_2_VIDEO mode only supports veo3_fast model";
          }
          if (params.aspectRatio !== '16:9') {
            newErrors.prompt = "REFERENCE_2_VIDEO mode only supports 16:9 aspect ratio";
          }
        }
        break;
      }
      
      case 'sora2': {
        const params = modeParams.params;
        if (!params.prompt?.trim()) {
          newErrors.prompt = "Prompt cannot be empty";
        } else if (params.prompt.length > 1000) {
          newErrors.prompt = "Prompt cannot exceed 1000 characters";
        }
        
        if (params.negative_prompt && params.negative_prompt.length > 300) {
          newErrors.negative_prompt = "Negative prompt cannot exceed 300 characters";
        }
        break;
      }
      
      case 'reframe': {
        const params = modeParams.params;
        if (params.model === 'veo3.1') {
          // Veo3.1 requires at least start frame or end frame
          if (!params.startFrame && !params.endFrame) {
            newErrors.reference_image = "Please upload at least one image (Start Frame or End Frame)";
          }
          if (!params.prompt?.trim()) {
            newErrors.prompt = "Prompt cannot be empty";
          }
        } else {
          // Sora2 requires sourceVideo
          if (!params.sourceVideo) {
            newErrors.reference_image = "Please upload a video or image";
          }
        }
        break;
      }
    }
    
    return newErrors;
  }, [modeParams]);

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    // Check credits balance using unified credit calculator
    const estimatedCost = calculateCredits(
      (modeParams.mode === 'sora2'
        ? (modeParams.params.duration || 8)
        : 8) as number,
      modeParams.mode === 'sora2'
        ? (modeParams.params.aspectRatio || '16:9')
        : (modeParams.params.targetAspectRatio || '16:9'),
      modeParams.mode
    );

    if (userCredits < estimatedCost) {
      setPendingCost(estimatedCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setIsGenerating(true);

    try {
      let request: CreateJobRequest;
      
      // Convert mode-specific params to CreateJobRequest
      if (modeParams.mode === 'veo3') {
        const params = modeParams.params;
        request = {
          prompt: params.prompt.trim(),
          duration_sec: 8 as Duration, // Veo3.1 defaults to 8 seconds
          aspect_ratio: params.aspectRatio === 'Auto' ? '16:9' : params.aspectRatio === '9:16' ? '9:16' : '16:9',
          cfg_scale: 7,
          model: 'veo3.1',
          // Veo3.1 specific fields
          veo3Params: {
            model: params.model,
            generationType: params.generationType,
            imageUrls: params.imageUrls,
            seeds: params.seeds,
            enableTranslation: params.enableTranslation,
            watermark: params.watermark
          }
        };
      } else if (modeParams.mode === 'sora2') {
        const params = modeParams.params;
        request = {
          prompt: params.prompt.trim(),
          negative_prompt: params.negative_prompt?.trim(),
          duration_sec: (params.duration || 8) as Duration,
          aspect_ratio: params.aspectRatio,
          cfg_scale: 7,
          model: params.model || 'sora2'
        };
      } else if (modeParams.mode === 'reframe') {
        const params = modeParams.params;
        
        // Handle Veo3.1 image-to-video
        if (params.model === 'veo3.1') {
          // Upload start and end frames
          const imageUrls: string[] = [];
          
          if (params.startFrame) {
            try {
              const startUrl = await videoApi.uploadVideo(params.startFrame, user.id);
              imageUrls.push(startUrl);
            } catch (uploadError) {
              throw new Error(`Failed to upload start frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
            }
          }
          
          if (params.endFrame) {
            try {
              const endUrl = await videoApi.uploadVideo(params.endFrame, user.id);
              imageUrls.push(endUrl);
            } catch (uploadError) {
              throw new Error(`Failed to upload end frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
            }
          }

          if (imageUrls.length === 0) {
            throw new Error('At least one image (Start Frame or End Frame) is required');
          }

          request = {
            prompt: params.prompt?.trim() || 'Create a smooth video transition between the frames',
            duration_sec: 8 as Duration,
            aspect_ratio: params.targetAspectRatio === 'Auto' ? '16:9' : params.targetAspectRatio === '9:16' ? '9:16' : '16:9',
            cfg_scale: 7,
            model: 'veo3.1',
            veo3Params: {
              model: params.veo3SubModel || 'veo3_fast', // Use selected sub-model or default to fast
              generationType: imageUrls.length === 1 ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'FIRST_AND_LAST_FRAMES_2_VIDEO',
              imageUrls: imageUrls,
              seeds: params.seeds,
              enableTranslation: true
            }
          };
        } else {
          // Handle Sora2 image-to-video (existing logic)
          // Upload source video first to get public URL
          let videoUrl: string | undefined;
          if (params.sourceVideo) {
            try {
              videoUrl = await videoApi.uploadVideo(params.sourceVideo, user.id);
            } catch (uploadError) {
              throw new Error(`Failed to upload source video: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
            }
          }

          if (!videoUrl) {
            throw new Error('Reference image URL is required for image-to-video mode');
          }

          request = {
            prompt: params.prompt?.trim() || 'Create a smooth video animation from the reference image',
            duration_sec: 8,
            aspect_ratio: params.targetAspectRatio,
            cfg_scale: 7,
            reference_image_url: videoUrl,
            model: params.model || 'sora2'
          };
        }
      } else {
        throw new Error('Invalid generation mode');
      }

      const response = await videoApi.createJob(request, modeParams.mode);

      // Create initial job object
      const newJob: Job = {
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        params: request,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: estimatedCost
      };

      console.log('Creating new job:', {
        jobId: newJob.jobId,
        status: newJob.status,
        responseStatus: response.status
      });

      // 添加更明显的日志
      console.warn('📝 NEW JOB CREATED:', {
        jobId: newJob.jobId,
        status: newJob.status,
        timestamp: new Date().toISOString()
      });

      // Add to jobs list and set as current job
      setJobs(prevJobs => [newJob, ...prevJobs]);
      setCurrentJob(newJob);
      
      // Start polling for this job
      startPolling(response.jobId);
      
    } catch (error) {
      console.error('Failed to create job:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        modeParams
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to create generation job';

      // Enhanced error handling with specific messages
      if (/\b402\b/.test(errorMessage) || /HTTP\s*402/.test(errorMessage) || errorMessage.includes('Insufficient credits')) {
        // Show subscription modal for insufficient balance
        setPendingCost(estimatedCost);
        setShowSubscriptionModal(true);
      } else if (errorMessage.includes('Insufficient credits')) {
        // Parse the detailed error response
        try {
          const errorData = JSON.parse(errorMessage);
          if (errorData.required && errorData.available !== undefined) {
            setErrors({ 
              prompt: `Insufficient credits. You need ${errorData.required} credits but only have ${errorData.available}. ${errorData.details || 'Please purchase more credits or subscribe to a plan.'}` 
            });
          } else {
            setErrors({ prompt: 'Insufficient credits. Please purchase more credits or subscribe to a plan.' });
          }
        } catch {
          setErrors({ prompt: 'Insufficient credits. Please purchase more credits or subscribe to a plan.' });
        }
      } else if (errorMessage.includes('upload') || errorMessage.includes('video')) {
        setErrors({ reference_image: errorMessage });
      } else if (errorMessage.includes('credit')) {
        setErrors({ prompt: 'Credit system error. Please contact support if this persists.' });
      } else {
        setErrors({ prompt: errorMessage });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [modeParams, startPolling, user, isAuthenticated, userCredits, validateForm, calculateCredits]);

  // Handle retry
  const handleRetry = useCallback(async (job: Job) => {
    if (!user?.id) {
      console.error('User not authenticated');
      setShowAuthModal(true);
      return;
    }
    
    // Check credits balance
    if (userCredits <= 0) {
      setErrors({ 
        prompt: 'Insufficient credits. Please purchase more credits to retry.' 
      });
      return;
    }
    
    setErrors({});
    
    try {
      const mode = job.params.reference_image_url ? 'reframe' : 'sora2';
      
      // 调试：检查重试参数
      console.log('🔄 Retry parameters:', {
        mode,
        params: job.params,
        hasPrompt: !!job.params.prompt,
        hasDurationSec: !!job.params.duration_sec,
        hasAspectRatio: !!job.params.aspect_ratio,
        hasReferenceImage: !!job.params.reference_image_url
      });
      
      const response = await videoApi.createJob(job.params, mode);

      const retryCost = calculateCredits(
        job.params.duration_sec,
        job.params.aspect_ratio,
        mode
      );

      const newJob: Job = {
        ...job,
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        created_at: new Date().toISOString(),
        error: undefined,
        creditCost: retryCost
      };

      setJobs(prevJobs => [newJob, ...prevJobs]);
      setCurrentJob(newJob);
      startPolling(response.jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry job';
      
      if (errorMessage.includes('credit')) {
        setErrors({ prompt: 'Insufficient credits. Please purchase more credits.' });
      } else {
        setErrors({ prompt: errorMessage });
      }
    }
  }, [startPolling, user, userCredits, calculateCredits]);

  // Handle cancel
  const handleCancel = useCallback(async (jobId: string) => {
    try {
      await videoApi.cancelJob(jobId);
      
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.jobId === jobId
            ? { ...job, status: 'CANCELED' as const }
            : job
        )
      );
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, []);

  // Handle copy params
  const handleCopyParams = useCallback(
    (job: Job) => {
      const mode = job.params.reference_image_url ? 'reframe' : 'sora2';

      setModeParams(prev => {
        if (prev.mode === 'sora2') {
          sora2ParamsCache.current = prev.params as Sora2Params;
        } else {
          reframeParamsCache.current = prev.params as ReframeParams;
        }

        if (mode === 'reframe') {
          const params: ReframeParams = {
            sourceVideo: undefined,
            targetAspectRatio:
              job.params.aspect_ratio === '1:1'
                ? '16:9'
                : job.params.aspect_ratio,
            style: 'zoom',
            speed: 'normal',
            prompt: job.params.prompt
          };

          return {
            mode: 'reframe',
            params
          };
        }

        const params: Sora2Params = {
          prompt: job.params.prompt,
          negative_prompt: job.params.negative_prompt || '',
          duration: job.params.duration_sec,
          aspectRatio: job.params.aspect_ratio,
          style: 'realistic'
        };

        return {
          mode: 'sora2',
          params
        };
      });

      setGenerationMode(mode);
      const target = routeFromMode(mode);
      if (pathname !== target) {
        router.push(target);
      }
    },
    [setModeParams, setGenerationMode, router, pathname, routeFromMode]
  );

  // Sync external URL -> internal mode
  useEffect(() => {
    const next = modeFromPathname(pathname || '');
    if (next !== generationMode) {
      // only update state; handleModeChange would push again
      setModeParams(prev => {
        if (prev.mode === next) return prev;
        const nextParams = next === 'sora2' ? sora2ParamsCache.current : reframeParamsCache.current;
        if (next === 'sora2') {
          return { mode: 'sora2', params: { ...(nextParams as Sora2Params) } } as ModeParams;
        }
        return { mode: 'reframe', params: { ...(nextParams as ReframeParams) } } as ModeParams;
      });
      setGenerationMode(next);
    }
  }, [pathname, modeFromPathname]);

  // Handle toggle visibility
  const handleToggleVisibility = useCallback((jobId: string, visibility: 'public' | 'private') => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.jobId === jobId
          ? { ...job, visibility }
          : job
      )
    );
  }, []);

  // Watermark remover handler
  const handleWatermarkRun = useCallback(async () => {
    setWatermarkError(undefined);
    setOutputUrl(undefined);

    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (!hasActiveSubscription) { 
      setShowSubscriptionModal(true); 
      return; 
    }
    if (!isValid) {
      setWatermarkError('Enter a valid Sora URL starting with https://sora.chatgpt.com/.');
      return;
    }

    // Pre-check: requires 10 credits
    if ((subscription?.credits || 0) < 10) { 
      setPendingCost(10); 
      setShowBalanceDialog(true); 
      return; 
    }

    setIsRunning(true);
    try {
      const res = await watermarkApi.create(videoUrl);
      setJobId(res.jobId);
      // poll using existing status endpoint
      const poll = async () => {
        const resp = await fetch(`/api/kie/status/${res.jobId}`, { 
          headers: { 
            'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token}` 
          }, 
          cache: 'no-store' 
        });
        if (!resp.ok) {
          throw new Error(`Status HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data.status === 'completed' && data.video_url) {
          setOutputUrl(data.video_url);
          setIsRunning(false);
          return;
        }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 1500);
    } catch (e: any) {
      const msg = e?.message || '';
      if (/HTTP\s*402/.test(msg) || /Insufficient\s*credits/i.test(msg)) {
        setPendingCost(10);
        setShowBalanceDialog(true);
      } else {
        setWatermarkError(msg || 'Failed to start task');
      }
      setIsRunning(false);
    }
  }, [isAuthenticated, hasActiveSubscription, isValid, videoUrl, subscription]);

  const isWatermarkRemover = mounted && pathname === '/watermark-remover';

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead 
        title={isWatermarkRemover 
          ? "Sora2 Watermark Remover | Remove Sora Watermarks"
          : routeFromMode(generationMode) === '/image-to-video' 
          ? "Generate with Sora2 | Image to Video Workspace"
          : "Text to Video of AI Video Generator"}
        description={isWatermarkRemover
          ? "Sora2 watermark remover: remove Sora watermarks from Sora-hosted videos in seconds. Commercial use, API-ready, works with public sora.chatgpt.com links."
          : routeFromMode(generationMode) === '/image-to-video'
          ? "Use Sora 2 AI to transform images into HD video with synced audio. Sora 2 image-to-video technology creates cinematic videos from photos. Launch Sora 2 studio, switch modes, preview results, and manage credits in one place with Sora 2."
          : "Transform your ideas into cinematic videos - just by typing."}
        canonical={isWatermarkRemover 
          ? 'https://saro2.ai/watermark-remover'
          : routeFromMode(generationMode) === '/image-to-video' ? 'https://saro2.ai/image-to-video' : 'https://saro2.ai/text-to-video'}
        keywords={isWatermarkRemover
          ? "sora2 watermark remover,Sora watermark remover,remove watermark sora,watermark removal Sora2"
          : routeFromMode(generationMode) === '/image-to-video'
          ? "Sora2 workspace,Sora2 studio,Sora video generator,image to video,Sora 2 AI,AI video workflow"
          : "text to video,AI video generator,text to video AI,AI video creator,cinematic video generator,AI video maker"}
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {isWatermarkRemover ? (
            <>
              <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Sora2 Watermark Remover</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">Remove the Sora watermark from your Sora-hosted videos. Paste a public `sora.chatgpt.com` URL and run. Typical processing takes 1–3 seconds on the API.</p>
              </header>

              {watermarkError && (
                <div className="mb-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{watermarkError}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">Input</span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">Credits: {userCredits}</span>
                    </div>

                    <label className="block text-sm font-medium text-foreground mb-2">video_url</label>
                    <input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://sora.chatgpt.com/p/..."
                      className={`w-full px-4 py-3 rounded-xl border bg-background ${isValid ? 'border-border' : 'border-red-500'}`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Must be publicly accessible and start with `https://sora.chatgpt.com/`.</p>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => { setVideoUrl(''); setOutputUrl(undefined); setWatermarkError(undefined); }}
                        className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted"
                      >Reset</button>
                      <button
                        onClick={handleWatermarkRun}
                        disabled={isRunning || !isValid}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {isRunning ? (
                          <span className="inline-flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Running…</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><Play className="w-4 h-4" /> Run 10credits</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">Output</span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">video</span>
                    </div>

                    {outputUrl ? (
                      <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                        <video className="w-full h-full object-cover" controls src={outputUrl}>
                          <source src={outputUrl} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : showingSample && sampleVideo ? (
                      <div className="space-y-4">
                        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-accent" />
                            <span className="font-bold text-accent-foreground/80">Example Video</span>
                          </div>
                          <p className="text-sm text-accent-foreground/80">
                            This is a sample video generated by Sora 2 AI. Upload your own Sora video to remove watermarks!
                          </p>
                        </div>
                        
                        <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                          <video 
                            className="w-full h-full object-cover"
                            controls
                            poster={sampleVideo.thumbnailUrl}
                            src={sampleVideo.videoUrl}
                            preload="metadata"
                          >
                            <source src={sampleVideo.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {sampleVideo.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                        {isRunning ? 'Processing…' : jobId ? 'Waiting for result…' : 'No output yet'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 mb-8">
                <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-sm">This tool consumes 10 credits per run. Keep your Sora2 videos clean and brand-ready.</p>
                </div>
              </div>

              {/* Documentation block */}
              <section className="mt-10 mb-16">
                <h2 className="text-2xl font-bold mb-6">Sora2 Watermark Remover Documentation</h2>

                {/* Feature rows */}
                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <div>
                    <h3 className="text-lg font-semibold">Intelligent Detection in Sora2 Watermark Remover</h3>
                    <p className="text-muted-foreground mt-2">
                      The <strong>sora2 watermark remover</strong> detects and tracks static or moving overlays with AI. It pinpoints logos, text and stickers, then reconstructs pixels so colors, motion, and structure stay true to the original.
                    </p>
                  </div>
                  <figure className="bg-card border border-border rounded-xl overflow-hidden">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/4.webp" alt="sora2 watermark remover intelligent detection" className="w-full h-auto" loading="lazy" />
                  </figure>
                </div>

                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <figure className="bg-card border border-border rounded-xl overflow-hidden order-2 md:order-1">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/2.webp" alt="sora2 watermark remover frame consistent output" className="w-full h-auto" loading="lazy" />
                  </figure>
                  <div className="order-1 md:order-2">
                    <h3 className="text-lg font-semibold">Remove Watermark with Frame‑Consistent Output</h3>
                    <p className="text-muted-foreground mt-2">
                      With motion‑aware tracking, the <strong>sora2 watermark remover</strong> preserves flow and lighting balance. Your clips stay smooth and stable without flicker—ready for export or re‑edit.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <div>
                    <h3 className="text-lg font-semibold">Seamless Restoration and Audio Sync</h3>
                    <p className="text-muted-foreground mt-2">
                      Using AI reconstruction, the <strong>sora2 watermark remover</strong> fills removed regions naturally, restoring textures and color while keeping audio perfectly in sync for clean, high‑quality Sora videos.
                    </p>
                  </div>
                  <figure className="bg-card border border-border rounded-xl overflow-hidden">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/3.webp" alt="sora2 watermark remover seamless restoration" className="w-full h-auto" loading="lazy" />
                  </figure>
                </div>

                {/* What you can remove */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">What You Can Remove Using Sora2 Watermark Remover</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Capabilities of the <strong>sora2 watermark remover</strong></p>
                <div className="grid md:grid-cols-2 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora 2</div>
                    <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora 2 Video</h4>
                    <p className="text-muted-foreground">AI tracking clears moving or static overlays while the <strong>sora2 watermark remover</strong> keeps motion smooth and natural.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora 2 Pro</div>
                    <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora 2 Pro Video</h4>
                    <p className="text-muted-foreground">Optimized for 1080p/cinematic outputs, the <strong>sora2 watermark remover</strong> handles embedded or semi‑transparent overlays.</p>
                  </div>
                </div>

                {/* Why remove */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why remove watermarks</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Benefits of using the <strong>sora2 watermark remover</strong></p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Professional</div>
                    <h4 className="text-xl font-semibold mb-2">Create Clean, Professional Videos</h4>
                    <p className="text-muted-foreground">The <strong>sora2 watermark remover</strong> removes visual noise so clips look polished for marketing, social, and presentations.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Editing</div>
                    <h4 className="text-xl font-semibold mb-2">Prepare Clips for Editing & Reuse</h4>
                    <p className="text-muted-foreground">Start with a clean base—transitions, grading, and effects work better after the <strong>sora2 watermark remover</strong> pass.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Workflow</div>
                    <h4 className="text-xl font-semibold mb-2">Integrate with AI Workflows</h4>
                    <p className="text-muted-foreground">Consistent, watermark‑free outputs make it easy to chain the <strong>sora2 watermark remover</strong> with other AI tools.</p>
                  </div>
                </div>

                {/* How to remove for free */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">How to remove for free</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Three easy steps with the <strong>sora2 watermark remover</strong></p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">1</div>
                    <h4 className="text-xl font-semibold mb-2">Paste your Sora URL</h4>
                    <p className="text-muted-foreground">Open the playground and paste your video link; the <strong>sora2 watermark remover</strong> prepares it for AI detection.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">2</div>
                    <h4 className="text-xl font-semibold mb-2">Generate</h4>
                    <p className="text-muted-foreground">Click once— the <strong>sora2 watermark remover</strong> detects and removes logos/text across frames.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">3</div>
                    <h4 className="text-xl font-semibold mb-2">Download & integrate</h4>
                    <p className="text-muted-foreground">Preview and save the clean clip; integrate the <strong>sora2 watermark remover</strong> into your workflow.</p>
                  </div>
                </div>

                {/* Use cases */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Use cases</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Where the <strong>sora2 watermark remover</strong> fits</p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Publish clean AI videos</h4><p className="text-muted-foreground">Use the <strong>sora2 watermark remover</strong> before posting to social, YouTube, or portfolios.</p></div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Editing & remix</h4><p className="text-muted-foreground">A clean base from the <strong>sora2 watermark remover</strong> avoids artifacts in transitions and effects.</p></div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Automated pipelines</h4><p className="text-muted-foreground">Developers can batch clips through the <strong>sora2 watermark remover</strong> for consistent results.</p></div>
                </div>
              </section>

              {/* FAQ styled like homepage */}
              <section className="py-16 bg-muted/30 rounded-2xl">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">Frequently asked <span className="text-primary">questions</span></h2>
                    <p className="text-xl text-muted-foreground">Quick answers about the <strong>sora2 watermark remover</strong></p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="divide-y divide-border">
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">How do I remove the watermark from a Sora video?</summary>
                        <div className="text-muted-foreground pt-2">Open the playground, paste the URL, click Generate—the <strong>sora2 watermark remover</strong> does the rest.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Can I use it for free?</summary>
                        <div className="text-muted-foreground pt-2">Yes—try the <strong>sora2 watermark remover</strong> with free credits after sign‑up.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Does it support Sora 2 Pro videos?</summary>
                        <div className="text-muted-foreground pt-2">Yes, the <strong>sora2 watermark remover</strong> handles semi‑transparent overlays in Pro outputs.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">What types of watermarks can be removed?</summary>
                        <div className="text-muted-foreground pt-2">Logos, text, and overlays—static or moving—via the <strong>sora2 watermark remover</strong>.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Does removal affect quality?</summary>
                        <div className="text-muted-foreground pt-2">The <strong>sora2 watermark remover</strong> uses reconstruction to keep texture and motion consistent.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Can I integrate it into my workflow?</summary>
                        <div className="text-muted-foreground pt-2">Yes—call the API directly or chain Sora 2 + <strong>sora2 watermark remover</strong>.</div>
                      </details>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Page Header with H1 */}
              <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {routeFromMode(generationMode) === '/image-to-video' 
                    ? 'Sora 2 Image to Video Generator'
                    : 'Sora 2 Text to Video Generator'}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {routeFromMode(generationMode) === '/image-to-video'
                    ? 'Transform your images into cinematic videos with Sora 2 AI technology — no watermark'
                    : 'Create cinematic videos from text prompts using Sora 2 AI — no watermark'}
                </p>
              </header>

              {/* Error Display */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.prompt || errors.reference_image || Object.values(errors)[0]}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel: Input */}
              <div className="space-y-6">
                <div className="relative bg-card border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">Input</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border border-primary/20">
                        <span>Credits: {userCredits}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mode-specific UI */}
                  {modeParams.mode === 'veo3' && (
                    <Veo3Mode
                      params={modeParams.params as Veo3Params}
                      onChange={handleVeo3ParamsChange}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      onModelChange={handleModelChange}
                    />
                  )}

                  {modeParams.mode === 'sora2' && (
                    <Sora2Mode
                      params={modeParams.params as Sora2Params}
                      onChange={handleSora2ParamsChange}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                    />
                  )}

                  {modeParams.mode === 'reframe' && (
                    <>
                      {(modeParams.params as ReframeParams).model === 'veo3.1' ? (
                        <Veo3ImageMode
                          params={modeParams.params as ReframeParams}
                          onChange={handleReframeParamsChange}
                          onGenerate={handleGenerate}
                          isGenerating={isGenerating}
                          onModelChange={handleModelChange}
                        />
                      ) : (
                        <ReframeMode
                          params={modeParams.params as ReframeParams}
                          onChange={handleReframeParamsChange}
                          onGenerate={handleGenerate}
                          isGenerating={isGenerating}
                        />
                      )}
                    </>
                  )}
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
                      Video
                    </span>
                  </div>

                  {/* Show sample video for all users */}
                  {showingSample && sampleVideo ? (
                    <div className="space-y-4">
                      <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-accent" />
                          <span className="font-bold text-accent-foreground/80">Example Video</span>
                        </div>
                        <p className="text-sm text-accent-foreground/80">
                          {isAuthenticated 
                            ? "This is a sample video generated by Sora 2 AI. Create your own videos using the input panel!"
                            : "This is a sample video generated by Sora 2 AI. Sign up to create your own!"
                          }
                        </p>
                      </div>
                      
                      <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          poster={sampleVideo.thumbnailUrl}
                          src={sampleVideo.videoUrl}
                          preload="metadata"
                        >
                          <source src={sampleVideo.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {sampleVideo.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Only show signup button for unauthenticated users */}
                      {!isAuthenticated && (
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Sign Up to Create Your Own
                        </button>
                      )}
                    </div>
                  ) : (
                    <VideoPreview
                      currentJob={currentJob}
                      onRetry={handleRetry}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Marketing Content - Only for text-to-video */}
            {routeFromMode(generationMode) === '/text-to-video' && (
              <>
                {/* Hero Section */}
                <section className="mt-16 mb-12">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      Text to Video of AI Video Generator
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      Transform your ideas into cinematic videos - just by typing.
                    </p>
                  </div>
                  
                  {/* Example Videos Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Film className="w-8 h-8 text-primary/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Features Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    The Features of AI Video Generator for Text to Video
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Script-to-Screen Magic</h3>
                          <p className="text-muted-foreground">
                            With Text to Video, all you need is a prompt. Whether it's a single sentence or a detailed story, our AI engine interprets your text and converts it into stunning visuals. Ideal for creators, marketers, educators, and anyone who wants to turn words into high-impact video.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Cinematic Quality with Zero Editing Skills</h3>
                          <p className="text-muted-foreground">
                            Our advanced AI ensures every frame is professionally rendered. You get smooth transitions, realistic lighting, and dynamic motion - without ever opening a video editor. From social reels to product explainers, your content gets a studio-level upgrade.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Built-in Audio That Matches Your Message</h3>
                          <p className="text-muted-foreground">
                            No need for separate sound design. The AI generates background music, ambient sounds, or even voiceovers in sync with your script. It's an end-to-end AI Video Generator experience, built for creators in a hurry.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Contextual Scene Generation with Human-Centric Focus</h3>
                          <p className="text-muted-foreground">
                            The system understands not just your words, but the mood, tone, and intent behind them. Whether you want suspense, humor, emotion, or clarity - the AI chooses visuals that align with your purpose.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* How to Use Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    How to Use the AI Video Generator for Text to Video
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Sign Up or Log In to saro2.ai</h3>
                      <p className="text-muted-foreground text-sm">
                        Create an account to unlock the full features of our Text to Video interface.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Access the Text to Video Creation Panel</h3>
                      <p className="text-muted-foreground text-sm">
                        Find the tool on your dashboard and choose to start from scratch or use AI assistance.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Type or Paste Your Script</h3>
                      <p className="text-muted-foreground text-sm">
                        Enter your idea in the text box. You can type a simple prompt, scene description, or full script.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">4</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Click to Generate</h3>
                      <p className="text-muted-foreground text-sm">
                        Click the "Generate" button. The AI will process your script and create a video with matching visuals, motion, and music. It only takes a few minutes, and your video will be ready to preview and download.
                      </p>
                    </Card>
                  </div>
                </section>

                {/* Who Uses Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Who Uses Sora 2?
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Content creators</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Zap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">TikTok marketers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <GraduationCap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">E-commerce sellers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Rocket className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Short-film studios</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Palette className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Advertisers</h3>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    What About the Text to Video with AI Video Generator
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Sora 2 AI Text to Video tool helped me turn my blog posts into engaging videos in minutes. A total game-changer for my content strategy!"</p>
                      <p className="font-semibold text-foreground">- Sophia M., Content Creator</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"As a marketer, I'm amazed by how quickly I can generate ad videos just by typing a few lines. It's fast, smart, and saves me hours."</p>
                      <p className="font-semibold text-foreground">- David K., Digital Marketer</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I've tried many AI tools, but this one nails the visuals and pacing like a pro. Perfect for my social media campaigns!"</p>
                      <p className="font-semibold text-foreground">- Lena T., Social Media Manager</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I used Sora 2 AI to create a product explainer video. The results looked like I hired a professional team!"</p>
                      <p className="font-semibold text-foreground">- Jason P., Startup Founder</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Perfect for creating training materials. I simply typed the key points and the AI handled the rest. Super efficient."</p>
                      <p className="font-semibold text-foreground">- Ravi D., HR Specialist</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"From script to video in one step—this tool has transformed how I pitch my creative ideas to clients."</p>
                      <p className="font-semibold text-foreground">- Nina V., Creative Director</p>
                    </Card>
                  </div>
                </section>
              </>
            )}

            {/* Marketing Content - Only for image-to-video */}
            {routeFromMode(generationMode) === '/image-to-video' && (
              <>
                {/* Hero Section */}
                <section className="mt-16 mb-12">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      Sora 2 Image to Video Generator - Transform Photos into Cinematic Videos
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      Use Sora 2 AI to bring your static images to life with cinematic motion. Sora 2 image-to-video technology creates professional videos from photos with natural movement and realistic effects. Just upload your image and let Sora 2 handle the rest.
                    </p>
                  </div>
                  
                  {/* Example Videos Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-primary/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Features Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Sora 2 Image to Video Features - Advanced AI Video Generation
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Sora 2 Simple Image-to-Motion Transformation</h3>
                          <p className="text-muted-foreground">
                            With Sora 2 Image to Video, just upload your photo and watch it come alive. Sora 2 AI engine analyzes your image and generates natural, cinematic motion that enhances the scene. Sora 2 is perfect for product showcases, artistic creations, and bringing still moments into dynamic stories.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Sora 2 Professional Motion with Zero Animation Skills</h3>
                          <p className="text-muted-foreground">
                            Sora 2 advanced AI understands depth, lighting, and composition. Sora 2 generates smooth camera movements, natural object motion, and realistic environmental effects - all without requiring any animation or video editing expertise. Transform your portfolio photos into professional video content with Sora 2.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Sora 2 Automatic Audio Generation</h3>
                          <p className="text-muted-foreground">
                            Every Sora 2 video comes with perfectly matched background music and ambient sounds. Sora 2 AI analyzes your image's mood and atmosphere to create audio that complements the visual story. It's a complete Sora 2 video creation experience from a single image.
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Sora 2 Intelligent Scene Understanding</h3>
                          <p className="text-muted-foreground">
                            Sora 2 AI recognizes objects, people, landscapes, and scenes in your image. Sora 2 generates motion that makes sense contextually - whether it's a gentle breeze through trees, a product rotating in 3D space, or a portrait with subtle movement. Every Sora 2 animation feels natural and purposeful.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* How to Use Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    How to Use Sora 2 Image to Video Generator
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Sign Up or Log In to saro2.ai</h3>
                      <p className="text-muted-foreground text-sm">
                        Create an account to unlock the full Sora 2 Image to Video features and start using Sora 2 AI technology.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Access Sora 2 Image to Video Panel</h3>
                      <p className="text-muted-foreground text-sm">
                        Navigate to the Sora 2 Image to Video tool on your dashboard. Sora 2 interface is designed for easy image-to-video conversion.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Image to Sora 2</h3>
                      <p className="text-muted-foreground text-sm">
                        Drag and drop or select your image file for Sora 2 processing. Sora 2 supports photos, illustrations, product images, or any static visual you want to animate with Sora 2.
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">4</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Generate with Sora 2</h3>
                      <p className="text-muted-foreground text-sm">
                        Click the "Generate" button and let Sora 2 AI analyze your image. Sora 2 creates videos with natural motion, camera movement, and synchronized audio. Your Sora 2 animated video will be ready in minutes.
                      </p>
                    </Card>
                  </div>
                </section>

                {/* Who Uses Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Who Uses Sora 2?
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Content creators</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Zap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">TikTok marketers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <GraduationCap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">E-commerce sellers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Rocket className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Short-film studios</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Palette className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Advertisers</h3>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Why Choose Sora 2 Image to Video Generator
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I uploaded a product photo and Sora 2 generated a professional video ad in minutes. Sora 2 has completely changed how I create content for my online store!"</p>
                      <p className="font-semibold text-foreground">- Emma L., E-commerce Owner</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"As a photographer, I love how Sora 2 brings my static images to life. Sora 2 motion feels natural and adds so much depth to my portfolio."</p>
                      <p className="font-semibold text-foreground">- Michael R., Professional Photographer</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Sora 2 Image to Video feature saved me hours of animation work. I can now create engaging social media content from my existing photos instantly with Sora 2."</p>
                      <p className="font-semibold text-foreground">- Jessica T., Social Media Manager</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I used this to animate property photos for my real estate listings. The videos look professional and help properties stand out in the market."</p>
                      <p className="font-semibold text-foreground">- Robert K., Real Estate Agent</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Perfect for turning my design mockups into animated presentations. The AI understands the composition and adds motion that makes sense."</p>
                      <p className="font-semibold text-foreground">- Alex W., Graphic Designer</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"From a single product photo to a full video ad - this tool has streamlined my entire content creation workflow. Highly recommend!"</p>
                      <p className="font-semibold text-foreground">- Sarah H., Marketing Director</p>
                    </Card>
                  </div>
                </section>
              </>
            )}

            {/* Pricing Banner */}
            <div className="mt-8 mb-8">
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                  <span className="font-bold inline-block">💎 Pricing:</span> <Link href="/plans" className="inline-block text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 underline decoration-amber-300 dark:decoration-amber-500 hover:decoration-amber-500 dark:hover:decoration-amber-300 transition-colors">Starting from $19/month for high-quality 100 AI-generated videos with audio</Link>
                </p>
              </div>
            </div>

            {/* SEO-Optimized FAQ Section */}
            <section className="mt-12 mb-8" itemScope itemType="https://schema.org/FAQPage">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                {routeFromMode(generationMode) === '/text-to-video' 
                  ? "Frequently Asked Questions About AI Video Generator for Text to Video"
                  : routeFromMode(generationMode) === '/image-to-video'
                  ? "Frequently Asked Questions About AI Video Generator for Image to Video"
                  : "Frequently Asked Questions About Sora 2 AI Video Generator"}
              </h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {routeFromMode(generationMode) === '/text-to-video' ? (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What is the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Our AI Text to Video tool transforms your written prompts, stories, or scripts into fully generated videos using advanced AI. Just type your idea, and the AI brings it to life with visuals, motion, and music.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Do I need any video editing or design experience to use the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          No experience is needed. Simply enter your text prompt or video idea, and the AI will automatically generate a high-quality video for you - no technical skills required.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I customize the video style or theme with the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes. You can write your own prompt to describe the visual style, tone, pacing, or scene details you want. The AI will follow your instructions and generate a video that matches your creative vision.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        How long does it take to generate a video using Text to Video?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Most videos are generated in just a few minutes, depending on length and complexity. You'll be able to preview and download your video once it's ready.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What kind of videos can I create with the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          You can create a wide range of content - explainer videos, short films, social media posts, product demos, educational content, and more - all starting from simple text descriptions.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I use Text to Video generated videos for commercial purposes?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes. Videos created using our AI can be used for marketing, business, or any other commercial use, as long as they follow our usage and licensing terms.
                        </p>
                      </div>
                    </div>
                  </>
                ) : routeFromMode(generationMode) === '/image-to-video' ? (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What is the Image to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Our AI Image to Video tool transforms your static images into fully animated videos using advanced AI. Simply upload your photo, illustration, or product image, and the AI brings it to life with natural motion, camera movements, and synchronized audio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Do I need any animation or video editing experience to use the Image to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          No experience is needed. Simply upload your image file, and the AI will automatically generate a high-quality animated video with natural motion and professional effects - no technical skills required.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What types of images work best with the Image to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          The tool works with a wide variety of images including product photos, portraits, landscapes, illustrations, architectural photos, and design mockups. The AI analyzes the composition and generates motion that makes sense contextually for each image type.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        How long does it take to generate a video from an image?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Most videos are generated in just a few minutes, depending on complexity. The AI analyzes your image, generates motion, and adds synchronized audio. You'll be able to preview and download your animated video once it's ready.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What kind of motion does the AI add to images?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          The AI generates contextually appropriate motion such as smooth camera movements, natural object motion, environmental effects (like wind through trees), product rotations, and subtle portrait movements. The motion enhances the image without being distracting.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I use Image to Video generated videos for commercial purposes?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes. Videos created using our AI can be used for marketing, e-commerce, social media, business presentations, and any other commercial use, as long as they follow our usage and licensing terms.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What is Sora 2 AI Video Generator?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora 2 serves as a sophisticated AI-powered video creation system built on advanced Sora technology. It enables you to produce studio-grade videos using text inputs or image uploads within moments. Our service provides dual functionality for text-to-video and image-to-video conversion, delivering high-definition results with synchronized audio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Is Sora 2 video generator free to use?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes! Sora 2 offers a free tier to get started. You can try our AI video generator with limited credits. For unlimited access and premium features, plans start from $19/month for 100 high-quality AI-generated videos with audio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        How long does it take to generate a video with Sora 2?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora 2 AI generates videos in seconds to minutes depending on the complexity and length. Most standard videos (8-16 seconds) are ready in under 3 minutes. Our fast processing ensures you get high-quality results quickly.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What video formats and resolutions does Sora 2 support?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora 2 supports multiple aspect ratios including 16:9 (landscape), 9:16 (vertical/TikTok), and 1:1 (square). All videos are generated in HD quality with professional audio. You can download your videos in standard formats compatible with all platforms.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I use Sora 2 videos for commercial purposes?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes! Videos generated with Sora 2 AI can be used for commercial purposes including social media marketing, advertising, content creation, and more. Premium subscribers get full commercial rights with no platform watermark on generated videos.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Get Started Section - For text-to-video and image-to-video */}
            {(routeFromMode(generationMode) === '/text-to-video' || routeFromMode(generationMode) === '/image-to-video') && (
              <section className="mt-16 mb-12">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {routeFromMode(generationMode) === '/text-to-video' 
                      ? "Get Started with AI Video Generator for Text to Video"
                      : "Get Started with AI Video Generator for Image to Video"}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
                    {routeFromMode(generationMode) === '/text-to-video' 
                      ? "Ready to take your videos to the next level? Upgrade to access faster rendering, longer video durations, advanced customization, and premium styles. Whether you're creating for business, education, or content marketing, our Pro plan gives you everything you need to turn scripts into stunning, high-quality videos - effortlessly."
                      : "Ready to bring your images to life? Upgrade to access faster rendering, longer video durations, advanced motion effects, and premium styles. Whether you're creating product ads, portfolio showcases, or social media content, our Pro plan gives you everything you need to transform static images into stunning, animated videos - effortlessly."}
                  </p>
                  <Link href="/plans">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      Get Premium
                    </Button>
                  </Link>
                </div>
              </section>
            )}

            {/* Mobile: Fixed Generate Button */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
              <button
                className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                onClick={handleGenerate}
                disabled={isGenerating || userCredits <= 0}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent flex-shrink-0" />
                    <span className="whitespace-nowrap">Generating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current flex-shrink-0" />
                    <span className="whitespace-nowrap">Start Generation</span>
                  </>
                )}
              </button>
            </div>
            </>
          )}
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
      />
      <InsufficientCreditsDialog
        open={showBalanceDialog}
        onOpenChange={setShowBalanceDialog}
        requiredCredits={pendingCost ?? 10}
        availableCredits={subscription?.credits || 0}
        onRequestAuth={() => setShowAuthModal(true)}
      />
    </div>
  );
};

export default Generate;
