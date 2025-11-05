export interface StoryboardShot {
  prompt: string;
  duration: number; // seconds, sum must equal totalDuration
}

export interface StoryboardParams {
  shots: StoryboardShot[];
  n_frames: "10" | "15" | "25"; // string type matching API
  image_file?: File; // File object for upload
  aspect_ratio: "portrait" | "landscape";
}

// Sora 2 Pro Storyboard API Types
export interface SoraStoryboardRequest {
  model: "sora-2-pro-storyboard";
  input: {
    shots: Array<{
      Scene: string;      // KIE API 要求大写 S
      duration: number;   // 秒数
    }>;
    n_frames: "10" | "15" | "25";
    image_urls?: string[];
    aspect_ratio: "portrait" | "landscape";
  };
  callBackUrl?: string;
}

export interface SoraStoryboardResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface SoraTaskStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: "waiting" | "queuing" | "generating" | "success" | "fail";
    param: string; // JSON string of original request
    resultJson?: string; // JSON string with results when success
    failCode?: string;
    failMsg?: string;
    costTime?: number;
    completeTime?: number;
    createTime: number;
  };
}

export interface StoryboardJob {
  jobId: string;
  taskId: string; // Kie.ai task ID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  params: StoryboardParams;
  created_at: string;
  visibility: 'private' | 'public';
  creditCost: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  kieState?: "waiting" | "queuing" | "generating" | "success" | "fail"; // Kie.ai state
  resultUrls?: string[]; // Video URLs from Kie.ai
}
