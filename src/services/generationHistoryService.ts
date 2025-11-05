// Service for fetching video generation history
export interface GenerationHistoryItem {
  id: string;
  jobId: string;
  prompt: string;
  imageUrl?: string;
  aspectRatio: string;
  duration: number;
  resolution: string;
  model: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  creditsUsed: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GenerationHistoryResponse {
  jobs: GenerationHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

class GenerationHistoryService {
  private baseUrl = '/api/videos';

  async getHistory(limit: number = 50, offset: number = 0): Promise<GenerationHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/history?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch generation history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching generation history:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<GenerationHistoryItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch job status');
      }

      const data = await response.json();
      
      // Map the response to our interface
      return {
        id: data.job_id,
        jobId: data.job_id,
        prompt: data.prompt || '',
        imageUrl: data.image_url,
        aspectRatio: data.aspect_ratio || '16:9',
        duration: data.duration || 8,
        resolution: '1080p',
        model: 'sora-2-text-to-video',
        status: data.status === 'SUCCEEDED' ? 'completed' : 
                data.status === 'RUNNING' ? 'processing' :
                data.status === 'QUEUED' ? 'queued' : 'failed',
        creditsUsed: data.cost_credits || 30,
        videoUrl: data.result_url,
        thumbnailUrl: data.preview_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.status === 'SUCCEEDED' ? data.updated_at : undefined
      };
    } catch (error) {
      console.error('Error fetching job status:', error);
      return null;
    }
  }

  async downloadVideo(videoUrl: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      throw error;
    }
  }
}

export const generationHistoryService = new GenerationHistoryService();
