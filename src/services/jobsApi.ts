// Mock Jobs API Service for Sora2 Video Generation

import { 
  Job, 
  JobStatus, 
  CreateJobRequest, 
  CreateJobResponse, 
  JobError 
} from '@/types/jobs';

// Mock job storage (in a real app, this would be in a database)
class JobStorage {
  private jobs: Map<string, Job> = new Map();
  private jobQueue: string[] = [];
  
  addJob(job: Job): void {
    this.jobs.set(job.jobId, job);
    if (job.status === 'QUEUED') {
      this.jobQueue.push(job.jobId);
    }
  }
  
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }
  
  updateJob(jobId: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates, updated_at: new Date().toISOString() };
      this.jobs.set(jobId, updatedJob);
      return updatedJob;
    }
    return undefined;
  }
  
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }
  
  getNextQueuedJob(): string | undefined {
    return this.jobQueue.shift();
  }
}

const storage = new JobStorage();

// Job processing simulator
class JobProcessor {
  private processing: Set<string> = new Set();
  
  async processJob(jobId: string): Promise<void> {
    if (this.processing.has(jobId)) return;
    
    this.processing.add(jobId);
    
    const job = storage.getJob(jobId);
    if (!job) return;
    
    // Start processing
    storage.updateJob(jobId, { 
      status: 'RUNNING' as JobStatus, 
      progress: 0 
    });
    
    try {
      // Simulate video generation progress
      for (let progress = 0; progress <= 100; progress += Math.random() * 15) {
        await this.delay(1000 + Math.random() * 2000); // 1-3 second intervals
        
        const currentJob = storage.getJob(jobId);
        if (!currentJob || currentJob.status === 'CANCELED') {
          this.processing.delete(jobId);
          return;
        }
        
        storage.updateJob(jobId, { progress: Math.min(100, Math.floor(progress)) });
      }
      
      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;
      
      if (success) {
        // Success - generate mock video URL
        const mockVideoUrl = `https://cdn.veo3cloud.com/videos/${jobId}.mp4`;
        const mockPreviewUrl = `https://cdn.veo3cloud.com/thumbs/${jobId}.jpg`;
        
        storage.updateJob(jobId, {
          status: 'SUCCEEDED' as JobStatus,
          progress: 100,
          result_url: mockVideoUrl,
          preview_url: mockPreviewUrl
        });
      } else {
        // Failure - random error
        const errors: JobError[] = [
          { code: 'MODEL_RATE_LIMIT', message: '模型达到速率限制，请稍后重试' },
          { code: 'MODEL_BUSY', message: '队列繁忙，建议改为 8s 或稍后重试' },
          { code: 'CONTENT_BLOCKED', message: '内容违反使用政策，请修改后重试' }
        ];
        
        const error = errors[Math.floor(Math.random() * errors.length)];
        
        storage.updateJob(jobId, {
          status: 'FAILED' as JobStatus,
          error
        });
      }
      
    } catch (error) {
      storage.updateJob(jobId, {
        status: 'FAILED' as JobStatus,
        error: {
          code: 'UNKNOWN',
          message: 'An unexpected error occurred'
        }
      });
    } finally {
      this.processing.delete(jobId);
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const processor = new JobProcessor();

// Queue processor - simulates job queue management
setInterval(() => {
  const nextJobId = storage.getNextQueuedJob();
  if (nextJobId) {
    processor.processJob(nextJobId);
  }
}, 2000); // Check queue every 2 seconds

// API functions
export const jobsApi = {
  // Create a new job
  async createJob(request: CreateJobRequest): Promise<CreateJobResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Validate request
    if (!request.prompt?.trim()) {
      throw new Error('Prompt is required');
    }
    
    if (request.prompt.length > 1000) {
      throw new Error('Prompt too long (max 1000 characters)');
    }
    
    if (request.negative_prompt && request.negative_prompt.length > 300) {
      throw new Error('Negative prompt too long (max 300 characters)');
    }
    
    // Check for blocked content (simple keyword filter)
    const blockedKeywords = ['诈骗', '仿冒', '假冒', '欺诈'];
    const containsBlocked = blockedKeywords.some(keyword => 
      request.prompt.includes(keyword) || 
      (request.negative_prompt && request.negative_prompt.includes(keyword))
    );
    
    if (containsBlocked) {
      throw new Error('内容违反使用政策');
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Calculate cost estimate
    const creditCost = 30;
    
    // Create job
    const job: Job = {
      jobId,
      status: 'QUEUED',
      progress: 0,
      params: request,
      created_at: new Date().toISOString(),
      visibility: 'private',
      creditCost
    };
    
    storage.addJob(job);
    
    return {
      jobId,
      status: 'QUEUED',
      message: 'Job queued in mock processor'
    };
  },
  
  // Get job status
  async getJob(jobId: string): Promise<Job> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    
    const job = storage.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    return job;
  },
  
  // Cancel job
  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    const job = storage.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (['SUCCEEDED', 'FAILED', 'CANCELED'].includes(job.status)) {
      throw new Error('Job cannot be canceled');
    }
    
    storage.updateJob(jobId, { 
      status: 'CANCELED' as JobStatus 
    });
    
    return { success: true };
  },
  
  // Get all jobs for current user (mock)
  async getJobs(limit: number = 20): Promise<Job[]> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    const allJobs = storage.getAllJobs()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
    
    return allJobs;
  }
};

// Export as global fetch-like API for the hook (only in browser)
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).mockJobsAPI = {
    async fetch(url: string, options?: RequestInit): Promise<Response> {
      const [, , path] = url.split('/');
      const method = options?.method || 'GET';
      
      try {
        let result;
        
        if (method === 'POST' && path === 'jobs') {
          const body = JSON.parse(options?.body as string);
          result = await jobsApi.createJob(body);
        } else if (method === 'GET' && path.startsWith('jobs/')) {
          const jobId = path.split('/')[1];
          result = await jobsApi.getJob(jobId);
        } else if (method === 'POST' && path.includes('/cancel')) {
          const jobId = path.split('/')[1];
          result = await jobsApi.cancelJob(jobId);
        } else {
          throw new Error('Not found');
        }
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  };
}

export default jobsApi;
