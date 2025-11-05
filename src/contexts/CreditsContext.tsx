"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Helper functions for Supabase operations
type SupabaseUserRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_end_date: string | null;
  credits_balance: number | null;
  credits_total: number | null;
  credits_spent: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
};

const getUserSubscription = async (userId: string): Promise<(SupabaseUserRecord & { subscription: any }) | null> => {
  // First get user data from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_plan, subscription_status, subscription_end_date, credits_balance, credits_total, credits_spent, created_at, updated_at')
    .eq('id', userId)
    .single();
  
  let finalUserData = userData as SupabaseUserRecord | null;
  
  if (userError) {
    if (userError.code === 'PGRST116') {
      // User doesn't exist in users table, create them
      console.log('User not found in users table, creating...');
      const { data: authUser } = await supabase.auth.getUser();
      
      if (authUser.user) {
        try {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || '',
              subscription_plan: 'free',
              subscription_status: 'active',
              credits_balance: 0,
              credits_total: 0,
              credits_spent: 0,
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user:', createError);
            // Return a default user object instead of null
            return {
              id: userId,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || '',
              subscription_plan: 'free',
              subscription_status: 'active',
              subscription_end_date: null,
              credits_balance: 0,
              credits_total: 0,
              credits_spent: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              subscription: null
            };
          }
          
          // Use the newly created user data
          finalUserData = newUser as SupabaseUserRecord;
        } catch (error) {
          console.error('Exception creating user:', error);
          // Return a default user object instead of null - FIXED: Use same credits as normal case
          return {
            id: userId,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || '',
            subscription_plan: 'free',
            subscription_status: 'active',
            subscription_end_date: null,
            credits_balance: 0,
            credits_total: 0,
            credits_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription: null
          };
        }
      } else {
        console.error('No auth user found');
        return null;
      }
    } else {
      // Log a safer representation to avoid empty object confusion
      console.error('Error fetching user:', userError ?? '(no error object)');
      const isEmptyError = userError && typeof userError === 'object' && Object.keys(userError).length === 0;

      // 如果是权限问题或返回了空错误对象，返回基于 auth 用户的默认数据，而不是 null
      if (
        isEmptyError ||
        userError.code === '42501' ||
        userError.message?.includes('406') ||
        userError.message?.includes('403')
      ) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          finalUserData = {
            id: userId,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || '',
            subscription_plan: 'free',
            subscription_status: 'active',
            subscription_end_date: null,
            credits_balance: 0,
            credits_total: 0,
            credits_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as SupabaseUserRecord;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }

  // Then get subscription data from user_subscriptions table
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    console.error('Error fetching subscription:', subscriptionError);
    // 如果是权限问题，继续使用用户数据但订阅数据设为 null
    if (!(subscriptionError.code === '42501' || subscriptionError.message?.includes('406') || subscriptionError.message?.includes('403'))) {
      return null;
    }
  }

  // Return combined data
  if (!finalUserData) {
    return null;
  }

  return {
    ...finalUserData,
    subscription: subscriptionData
  };
};

const getUserGenerations = async (userId: string) => {
  const { data, error } = await supabase
    .from('video_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!error) return data || [];

  const isEmptyError = typeof error === 'object' && error !== null && Object.keys(error).length === 0;
  if (isEmptyError) {
    console.warn('Error fetching generations: empty error object received; attempting API fallback');
  } else {
    // Log both structured and raw error for visibility
    console.error('Error fetching generations (Supabase):', {
      code: (error as any).code,
      message: (error as any).message,
      details: (error as any).details,
      hint: (error as any).hint
    }, error);
  }

  // Fallback: call server API using access token (bypasses RLS via service role on server)
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return [];

    const res = await fetch('/api/jobs?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error('Jobs API fallback failed with status:', res.status);
      return [];
    }
    const json = await res.json();
    const jobs = Array.isArray(json?.jobs) ? json.jobs : [];

    // Map API job format to local expected generation format
    const statusMap: Record<string, 'processing' | 'completed' | 'failed'> = {
      QUEUED: 'processing',
      RUNNING: 'processing',
      SUCCEEDED: 'completed',
      FAILED: 'failed',
      CANCELED: 'failed',
      PENDING: 'processing'
    };

    const mapped = jobs.map((job: any) => ({
      // keep raw fields; caller will remap again later
      id: job.job_id || job.id || '',
      prompt: job.prompt,
      negative_prompt: job.negative_prompt,
      duration: job.duration ?? 0,
      resolution: job.aspect_ratio || job.resolution || '1280x720',
      model: job.model || 'sora2',
      status: statusMap[job.status] || 'processing',
      credits_used: job.cost_credits ?? 0,
      video_url: job.result_url,
      thumbnail_url: job.preview_url,
      created_at: job.created_at,
      completed_at: job.updated_at
    }));

    return mapped;
  } catch (fallbackError) {
    console.error('Error fetching generations (API fallback):', fallbackError);
    return [];
  }
};

const createVideoGeneration = async (params: any) => {
  const { data, error } = await supabase
    .from('video_jobs')
    .insert(params)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating generation:', error);
    throw error;
  }
  return data;
};

const updateVideoGeneration = async (generationId: string, updates: any) => {
  const { error } = await supabase
    .from('video_jobs')
    .update(updates)
    .eq('job_id', generationId);
  
  if (error) {
    console.error('Error updating generation:', error);
    throw error;
  }
};

// Types
export interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  credits: number;
  totalCredits: number;
  resetDate: string;
  createdAt: string;
}

export interface GenerationHistory {
  id: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: string;
  model: string;
  status: 'processing' | 'completed' | 'failed';
  creditsUsed: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface CreditsContextType {
  // User data
  subscription: UserSubscription | null;
  generations: GenerationHistory[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  refreshCredits: () => Promise<void>;
  generateVideo: (params: {
    prompt: string;
    negativePrompt?: string;
    duration: number;
    resolution: string;
    model: string;
  }) => Promise<{ success: boolean; generationId?: string; error?: string }>;
  
  // Utilities
  calculateCredits: (duration: number, resolution: string, model: string) => number;
  canGenerate: (requiredCredits: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};

interface CreditsProviderProps {
  children: ReactNode;
}

export const CreditsProvider: React.FC<CreditsProviderProps> = ({ children }) => {
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [generations, setGenerations] = useState<GenerationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();

  // Calculate credits required for generation
  const calculateCredits = (_duration: number, _resolution: string, _model: string): number => {
    // 每条视频统一按 30 credits 计费，后续如需区分规格可在此叠加 multiplier
    return 30;
  };

  // Check if user can generate with current credits
  const canGenerate = (requiredCredits: number): boolean => {
    const availableCredits = subscription?.credits ?? 0;
    return availableCredits >= requiredCredits;
  };

  // Refresh user credits and subscription data
  const refreshCredits = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // Fetch subscription and generation history from Supabase
      const [userSubscriptionData, generationsData] = await Promise.all([
        getUserSubscription(user.id),
        getUserGenerations(user.id)
      ]);

      if (userSubscriptionData) {
        // Map Supabase response to local types
        const mappedSubscription: UserSubscription = {
          id: String(userSubscriptionData.id ?? user.id),
          plan: userSubscriptionData.subscription_plan ?? 'free',
          status: userSubscriptionData.subscription_status ?? 'inactive',
          credits: userSubscriptionData.credits_balance ?? 0,
          totalCredits: userSubscriptionData.credits_total ?? 0,
          resetDate: userSubscriptionData.subscription_end_date ?? '',
          createdAt: userSubscriptionData.created_at ?? new Date().toISOString()
        };

        const mappedGenerations: GenerationHistory[] = generationsData.map(gen => ({
          id: gen.id.toString(),
          prompt: gen.prompt,
          negativePrompt: gen.negative_prompt,
          duration: gen.duration,
          resolution: gen.resolution,
          model: gen.model,
          status: gen.status,
          creditsUsed: gen.credits_used,
          videoUrl: gen.video_url,
          thumbnailUrl: gen.thumbnail_url,
          createdAt: gen.created_at,
          completedAt: gen.completed_at || ''
        }));

        setSubscription(mappedSubscription);
        setGenerations(mappedGenerations);
      } else {
        setSubscription(null);
        setGenerations([]);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Generate video function
  const generateVideo = async (params: {
    prompt: string;
    negativePrompt?: string;
    duration: number;
    resolution: string;
    model: string;
  }): Promise<{ success: boolean; generationId?: string; error?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const requiredCredits = calculateCredits(params.duration, params.resolution, params.model);
    
    if (!canGenerate(requiredCredits)) {
      return { success: false, error: 'Insufficient credits' };
    }

    try {
      // Create generation record in Supabase
      const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newGeneration = await createVideoGeneration({
        user_id: user.id,
        generation_id: generationId,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        duration: params.duration,
        resolution: params.resolution,
        model: params.model,
        status: 'processing',
        credits_used: requiredCredits,
      });

      // Map to local type
      const mappedGeneration: GenerationHistory = {
        id: newGeneration.id.toString(),
        prompt: newGeneration.prompt,
        negativePrompt: newGeneration.negative_prompt,
        duration: newGeneration.duration,
        resolution: newGeneration.resolution,
        model: newGeneration.model,
        status: newGeneration.status,
        creditsUsed: newGeneration.credits_used,
        videoUrl: newGeneration.video_url,
        thumbnailUrl: newGeneration.thumbnail_url,
        createdAt: newGeneration.created_at,
        completedAt: newGeneration.completed_at || ''
      };

      // Add to generations list
      setGenerations(prev => [mappedGeneration, ...prev]);
      
      // Refresh balance from server after deduction
      await refreshCredits();

      // Start polling for completion (mock - in real implementation this would call external API)
      setTimeout(() => {
        pollGenerationStatus(generationId);
      }, 2000);

      return { success: true, generationId: generationId };
    } catch (error) {
      console.error('Failed to generate video:', error);
      return { success: false, error: 'Generation failed' };
    }
  };

  // Poll generation status until completion (mock implementation)
  const pollGenerationStatus = async (generationId: string) => {
    const poll = async () => {
      try {
        // Mock completion after 10 seconds
        setTimeout(() => {
          // Update the generation to completed status with mock video URL
          setGenerations(prev => prev.map(gen => 
            gen.id === generationId ? {
              ...gen,
              status: 'completed' as const,
              videoUrl: 'https://demo-video-url.com/video.mp4',
              thumbnailUrl: 'https://demo-video-url.com/thumb.jpg',
              completedAt: new Date().toISOString()
            } : gen
          ));

          // Update in Supabase
          updateVideoGeneration(generationId, {
            status: 'completed',
            video_url: 'https://demo-video-url.com/video.mp4',
            thumbnail_url: 'https://demo-video-url.com/thumb.jpg',
            completed_at: new Date().toISOString()
          });
        }, 10000);
      } catch (error) {
        console.error('Failed to poll generation status:', error);
      }
    };

    poll();
  };

  // Load user data on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCredits();
    } else {
      setSubscription(null);
      setGenerations([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, refreshCredits]);

  const value: CreditsContextType = {
    subscription,
    generations,
    isLoading,
    refreshCredits,
    generateVideo,
    calculateCredits,
    canGenerate
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
};

export default CreditsContext;
