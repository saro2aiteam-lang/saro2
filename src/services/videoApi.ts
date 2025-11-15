// Real Video Generation API Service
import {
  Job,
  JobStatus,
  CreateJobRequest,
  CreateJobResponse,
} from '@/types/jobs';
import { supabase } from '@/lib/supabase';

const API_BASE = '/api/kie';

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  try {
    // Use the existing supabase client from the project
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to get session');
    }
    
    if (!session?.access_token) {
      console.error('No session or access token found');
      throw new Error('User not authenticated');
    }
    
    return session.access_token;
  } catch (error) {
    console.error('getAuthToken error:', error);
    throw new Error('User not authenticated');
  }
};

export const videoApi = {
  // Upload video file and get public URL
  async uploadVideo(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload video' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.video_url;
  },

  // Create a new video generation job
  async createJob(
    request: CreateJobRequest,
    mode: 'sora2' | 'reframe'
  ): Promise<CreateJobResponse> {
    const token = await getAuthToken();
    
    // Handle Veo3.1 API requests
    if (request.model === 'veo3.1' && request.veo3Params) {
      const veo3Body: any = {
        prompt: request.prompt,
        model: request.veo3Params.model,
        generationType: request.veo3Params.generationType,
        aspectRatio: request.aspect_ratio,
        enableTranslation: request.veo3Params.enableTranslation !== false, // default true
      };

      // Add imageUrls if provided
      if (request.veo3Params.imageUrls && request.veo3Params.imageUrls.length > 0) {
        veo3Body.imageUrls = request.veo3Params.imageUrls;
      }

      // Add optional parameters
      if (request.veo3Params.seeds) {
        veo3Body.seeds = request.veo3Params.seeds;
      }
      if (request.veo3Params.watermark) {
        veo3Body.watermark = request.veo3Params.watermark;
      }

      const apiUrl = `${API_BASE}/veo3/generate`;
      console.log('[Veo3.1 API] Request:', {
        url: apiUrl,
        body: veo3Body,
        hasToken: !!token
      });

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(veo3Body),
        });
      } catch (fetchError) {
        console.error('[Veo3.1 API] Fetch error:', {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          url: apiUrl,
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to Veo3.1 API. Please check your internet connection and try again.'}`);
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('[Veo3.1 API] Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to generate Veo3.1 video: ${response.status}`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[Veo3.1 API] JSON parse error:', parseError);
        throw new Error('Invalid response from Veo3.1 API');
      }
      
      console.log('[Veo3.1 API] Response:', data);
      
      // Handle response format from Veo3.1 API
      // Response format: { code: 200, msg: 'success', data: { taskId: '...' } }
      const taskId = data.data?.taskId || data.taskId;
      
      if (!taskId) {
        console.error('[Veo3.1 API] Missing taskId in response:', data);
        throw new Error('Missing taskId in Veo3.1 API response');
      }
      
      // Return in CreateJobResponse format
      return {
        jobId: taskId,
        status: 'PENDING' as const,
        message: data.msg || 'success'
      };
    }
    
    // Determine the model: use provided model, or fallback to mode-based logic
    let model: string;
    if (request.model) {
      // Map frontend model names to backend model names
      const modelMap: Record<string, string> = {
        'sora2': 'text-to-video',
        'veo3': 'veo3'
      };
      model = modelMap[request.model] || request.model;
    } else {
      // Fallback to existing logic
      model = mode === 'reframe' && request.reference_image_url ? 'image-to-video' : 'text-to-video';
    }
    
    // 验证必需参数
    if (!request.prompt) {
      throw new Error('Missing required parameter: prompt');
    }
    if (!request.duration_sec) {
      throw new Error('Missing required parameter: duration_sec');
    }
    if (!request.aspect_ratio) {
      throw new Error('Missing required parameter: aspect_ratio');
    }

    const requestBody: any = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      duration: request.duration_sec,
      resolution: '720p', // Default resolution
      model: model,
      aspect_ratio: request.aspect_ratio,
      style: 'realistic', // Default style
    };

    // Add image URL for image-to-video mode
    if (model === 'image-to-video' && request.reference_image_url) {
      requestBody.image_url = request.reference_image_url;
    }
    
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate video' }));
      const detailCandidates = [
        error?.hint, // 优先显示提示信息
        error?.details,
        error?.message,
        error?.error,
        error?.response?.msg,
        error?.response?.message,
        error?.response?.error,
      ];
      const detail =
        detailCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ??
        null;
      const codeCandidate =
        error?.code ??
        error?.response?.code ??
        error?.response?.status ??
        error?.status;
      const codeText =
        typeof codeCandidate === 'string' || typeof codeCandidate === 'number'
          ? ` (code: ${codeCandidate})`
          : '';
      const message = detail ? `${detail}${codeText}`.trim() : `HTTP ${response.status}${codeText}`;
      throw new Error(message);
    }

    const data = await response.json();

    console.log('Create job response:', {
      generation_id: data.generation_id,
      status: data.status,
      message: data.message
    });

    // 添加更明显的日志
    console.warn('🚀 VIDEO GENERATION STARTED:', {
      jobId: data.generation_id,
      status: data.status,
      timestamp: new Date().toISOString()
    });

    return {
      jobId: data.generation_id,
      status: (data.status || 'processing').toUpperCase() as JobStatus,
      message: data.message,
    };
  },

  // Get job status
  async getJob(jobId: string): Promise<Job> {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error('Invalid jobId:', jobId);
      throw new Error('Invalid job ID');
    }
    
    console.log('🔍 Getting job status for:', jobId);
    
    const token = await getAuthToken();
    console.log('🔑 Auth token obtained:', token ? 'Yes' : 'No');
    
    const url = `${API_BASE}/status/${jobId}`;
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 API Response data:', data);
    
    // Calculate progress based on status and elapsed time
    let progress = 0;
    
    // 优先检查状态和视频URL
    if (data.status === 'completed' || data.status === 'success' || data.video_url) {
      progress = 100;
      console.log('🎉 Video generation completed!', {
        status: data.status,
        video_url: data.video_url,
        progress: 100
      });
    } else if (data.status === 'processing' || data.status === 'running') {
      // For processing jobs, calculate progress based on elapsed time
      const createdTime = data.created_at ? new Date(data.created_at).getTime() : Date.now();
      const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);
      
      // Estimate progress based on typical 150-second generation time
      if (elapsedSeconds < 30) {
        progress = Math.min(20, (elapsedSeconds / 30) * 20);
      } else if (elapsedSeconds < 60) {
        progress = 20 + ((elapsedSeconds - 30) / 30) * 20;
      } else if (elapsedSeconds < 90) {
        progress = 40 + ((elapsedSeconds - 60) / 30) * 20;
      } else if (elapsedSeconds < 120) {
        progress = 60 + ((elapsedSeconds - 90) / 30) * 20;
      } else if (elapsedSeconds < 150) {
        progress = 80 + ((elapsedSeconds - 120) / 30) * 20;
      } else {
        // 超过150秒后，显示98%而不是95%，给用户更多期待
        progress = 98;
      }
    } else if (data.status === 'failed' || data.status === 'error') {
      progress = 0;
    }
    
    console.log('Progress calculation:', {
      status: data.status,
      video_url: data.video_url,
      calculated_progress: progress,
      has_video_url: !!data.video_url,
      full_response: data
    });
    
    // 如果状态是完成但没有视频URL，记录警告
    if ((data.status === 'completed' || data.status === 'success') && !data.video_url) {
      console.warn('⚠️ Status is completed but no video URL found:', {
        status: data.status,
        video_url: data.video_url,
        full_data: data
      });
    }
    
    const mappedStatus = mapStatusToJobStatus(data.status);
    
    console.log('📊 Final job data:', {
      jobId: data.generation_id,
      originalStatus: data.status,
      mappedStatus: mappedStatus,
      progress: Math.round(progress),
      hasVideoUrl: !!data.video_url,
      videoUrl: data.video_url,
      willShowVideo: mappedStatus === 'SUCCEEDED' && !!data.video_url,
      rawApiData: data
    });

    return {
      jobId: jobId,
      status: mappedStatus,
      progress: Math.round(progress),
      result_url: data.video_url,
      preview_url: data.thumbnail_url,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at,
      visibility: 'private',
      creditCost: data.credits_consumed ?? 0,
      params: {
        prompt: data.prompt || '',
        duration_sec: data.duration || 10,
        aspect_ratio: data.aspect_ratio || '16:9',
        cfg_scale: 7,
      },
      error: data.error_message ? {
        code: 'API_ERROR',
        message: data.error_message,
      } : undefined,
    };
  },

  // Cancel job (Note: Kie API may not support cancellation)
  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    // For now, return success as Kie API may not support job cancellation
    // In the future, this could call a refund endpoint if available
    console.warn('Job cancellation not supported by Kie API');
    return { success: false };
  },

  // Get all jobs for current user from local database
  async getJobs(limit: number = 20): Promise<Job[]> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/jobs?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch jobs:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(`[GET JOBS] Fetched ${data.jobs?.length || 0} jobs from database`);
      
      return data.jobs || [];
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      return [];
    }
  },
};

export default videoApi;

function mapStatusToJobStatus(status?: string): JobStatus {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'queued':
    case 'pending':
      return 'QUEUED';
    case 'processing':
    case 'running':
      return 'RUNNING';
    case 'completed':
    case 'success':
    case 'succeeded':
    case 'finish':
    case 'finished':
    case 'complete':
    case 'done':
      return 'SUCCEEDED';
    case 'failed':
    case 'fail':
      return 'FAILED';
    case 'canceled':
      return 'CANCELED';
    default:
      if (status) {
        console.warn('[videoApi] Unrecognized job status from provider:', status);
      }
      return 'PENDING';
  }
}
