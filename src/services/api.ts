'use server';

// API Configuration
const normalizeBaseUrl = (base?: string) => {
  if (!base) return 'https://api.kie.ai';
  return base.replace(/\/+$/, '');
};

const RAW_API_BASE_URL = normalizeBaseUrl(process.env.KIE_API_BASE_URL);
const API_BASE_URL = `${RAW_API_BASE_URL}/api/v1`;
const KIE_API_KEY = process.env.KIE_API_KEY;

// Types
export interface GenerateVideoRequest {
  prompt: string;
  negative_prompt?: string;
  duration: number;
  resolution: string;
  model: string;
  webhook_url?: string;
  // kie.ai specific parameters
  aspect_ratio?: string;
  style?: string;
}

export interface GenerateVideoResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  prompt: string;
  duration: number;
  resolution: string;
  model: string;
  credits_consumed: number;
  estimated_completion?: string;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface UserSubscription {
  id: string;
  plan: 'creator' | 'studio' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  credits: number;
  total_credits: number;
  reset_date: string;
  created_at: string;
}

export interface ApiKeyResponse {
  api_key: string;
  created_at: string;
  last_used?: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  if (!KIE_API_KEY) {
    throw new Error('KIE_API_KEY is not configured');
  }
  return KIE_API_KEY;
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': token,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
};

// API Methods
export const veoApi = {
  // Generate video
  async generateVideo(params: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    return apiRequest<GenerateVideoResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get generation status
  async getGeneration(id: string): Promise<GenerateVideoResponse> {
    return apiRequest<GenerateVideoResponse>(`/generate/${id}`);
  },

  // Get user subscription
  async getSubscription(): Promise<UserSubscription> {
    return apiRequest<UserSubscription>('/subscription');
  },

  // Get generation history
  async getGenerationHistory(limit = 20): Promise<GenerateVideoResponse[]> {
    return apiRequest<GenerateVideoResponse[]>(`/generations?limit=${limit}`);
  },

  // Get or create API key
  async getApiKey(): Promise<ApiKeyResponse> {
    return apiRequest<ApiKeyResponse>('/api-key');
  },

  // Regenerate API key
  async regenerateApiKey(): Promise<ApiKeyResponse> {
    return apiRequest<ApiKeyResponse>('/api-key', {
      method: 'POST',
    });
  },

  // Update subscription
  async updateSubscription(planId: string): Promise<UserSubscription> {
    return apiRequest<UserSubscription>('/subscription', {
      method: 'PUT',
      body: JSON.stringify({ plan_id: planId }),
    });
  },

  // Cancel subscription
  async cancelSubscription(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/subscription', {
      method: 'DELETE',
    });
  },

  // Purchase credits (one-time)
  async purchaseCredits(packageId: string): Promise<{ success: boolean; credits_added: number }> {
    return apiRequest<{ success: boolean; credits_added: number }>('/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ package_id: packageId }),
    });
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiRequest<{ status: string; timestamp: string }>('/health');
  }
};

// Mock API for development
export const mockSoraApi = {
  async generateVideo(params: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const id = `gen_${Date.now()}`;
    return {
      id,
      status: 'processing',
      prompt: params.prompt,
      duration: params.duration,
      resolution: params.resolution,
      model: params.model,
      credits_consumed: calculateMockCredits(params.duration, params.resolution, params.model),
      estimated_completion: new Date(Date.now() + 45000).toISOString(),
      created_at: new Date().toISOString()
    };
  },

  async getGeneration(id: string): Promise<GenerateVideoResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock progression: processing -> completed
    const isCompleted = Math.random() > 0.3; // 70% chance of completion
    
    return {
      id,
      status: isCompleted ? 'completed' : 'processing',
      prompt: 'Mock video generation',
      duration: 8,
      resolution: '1080p',
      model: 'sora2-fast',
      credits_consumed: 1.8,
      video_url: isCompleted ? 'https://example.com/mock-video.mp4' : undefined,
      thumbnail_url: isCompleted ? 'https://example.com/mock-thumb.jpg' : undefined,
      created_at: new Date(Date.now() - 30000).toISOString(),
      completed_at: isCompleted ? new Date().toISOString() : undefined
    };
  },

  async getSubscription(): Promise<UserSubscription> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: 'sub_mock_123',
      plan: 'studio',
      status: 'active',
      credits: 156,
      total_credits: 250,
      reset_date: '2024-02-15',
      created_at: '2024-01-15'
    };
  },

  async getGenerationHistory(): Promise<GenerateVideoResponse[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        id: 'gen_123',
        status: 'completed',
        prompt: 'A serene lake surrounded by mountains at sunset',
        duration: 8,
        resolution: '1080p',
        model: 'sora2-fast',
        credits_consumed: 1.8,
        video_url: 'https://example.com/video1.mp4',
        thumbnail_url: 'https://example.com/thumb1.jpg',
        created_at: '2024-01-20T14:30:00Z',
        completed_at: '2024-01-20T14:31:15Z'
      },
      {
        id: 'gen_124',
        status: 'completed',
        prompt: 'Urban cityscape with flying cars in the future',
        duration: 6,
        resolution: '720p',
        model: 'sora2-standard',
        credits_consumed: 4.0,
        video_url: 'https://example.com/video2.mp4',
        thumbnail_url: 'https://example.com/thumb2.jpg',
        created_at: '2024-01-20T10:15:00Z',
        completed_at: '2024-01-20T10:17:30Z'
      },
      {
        id: 'gen_125',
        status: 'processing',
        prompt: 'Underwater coral reef with tropical fish',
        duration: 10,
        resolution: '1080p',
        model: 'sora2-fast',
        credits_consumed: 2.1,
        created_at: '2024-01-20T16:45:00Z'
      }
    ];
  },

  async getApiKey(): Promise<ApiKeyResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      api_key: 'veo_sk_1234567890abcdef1234567890abcdef',
      created_at: '2024-01-15T10:00:00Z',
      last_used: '2024-01-20T14:30:00Z'
    };
  },

  async regenerateApiKey(): Promise<ApiKeyResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      api_key: `veo_sk_${Date.now()}${Math.random().toString(36).substring(2)}`,
      created_at: new Date().toISOString()
    };
  }
};

// Helper function to calculate mock credits
function calculateMockCredits(duration: number, resolution: string, model: string): number {
  let base = 1;
  
  // Duration multiplier
  if (duration === 8) base = 1.3;
  if (duration === 10) base = 1.6;
  
  // Resolution multiplier
  if (resolution === '1080p') base += 0.5;
  
  // Model multiplier
  if (model === 'sora2-standard') base += duration * 0.5;
  
  return Math.round(base * 10) / 10;
}

// Export the appropriate API based on environment
export const api = process.env.NEXT_PUBLIC_API_ENV === 'development' ? mockSoraApi : kieApi;
export default api;

// kie.ai API configuration - 使用服务器端路由
export const kieApi = {
  generateVideo: async (params: GenerateVideoRequest): Promise<GenerateVideoResponse> => {
    // 获取用户认证 token
    const token = await getAuthToken();
    
    const response = await fetch('/api/kie/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  },

  getGeneration: async (id: string): Promise<GenerateVideoResponse> => {
    // 获取用户认证 token
    const token = await getAuthToken();
    
    const response = await fetch(`/api/kie/status/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  },

  // 新增：积分退还功能
  refundCredits: async (generationId: string, reason?: string): Promise<{ success: boolean; refunded_amount: number; message: string }> => {
    const token = await getAuthToken();
    
    const response = await fetch('/api/kie/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        generation_id: generationId,
        reason: reason || 'generation_failed'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  },
};
