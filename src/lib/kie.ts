export type KieModel = 'sora-2-text-to-video' | 'sora-2-image-to-video';

export const mapAspectRatioToKie = (aspectRatio?: string): 'portrait' | 'landscape' => {
  if (!aspectRatio) return 'landscape';
  const normalized = aspectRatio.toLowerCase();
  if (['9:16', 'portrait', 'vertical'].includes(normalized)) return 'portrait';
  if (['16:9', 'landscape', 'horizontal'].includes(normalized)) return 'landscape';
  // 1:1 或其他自定义比例先默认归类为 landscape，后续若 API 支持可扩展
  return 'landscape';
};

export const mapKieStateToJobStatus = (state?: string): 'pending' | 'processing' | 'completed' | 'failed' => {
  const normalized = state?.toLowerCase();
  switch (normalized) {
    case 'waiting':
    case 'queued':
    case 'queue':
    case 'running':
    case 'processing':
    case 'generating':  // ← 添加 generating 状态
      return 'processing';
    case 'success':
    case 'succeeded':
    case 'completed':
    case 'complete':
    case 'done':
      return 'completed';
    case 'fail':
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'pending';
  }
};

interface ParsedResultJson {
  resultUrls?: string[];
  resultUrl?: string;
  mediaUrl?: string;
  resourceUrl?: string;
  // KIE API 可能返回的其他字段
  videoUrl?: string;
  outputUrl?: string;
  downloadUrl?: string;
  fileUrl?: string;
  url?: string;
}

const normalizeResultPayload = (payload: unknown): ParsedResultJson => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const result = payload as Record<string, unknown>;
  const urls = Array.isArray(result.resultUrls)
    ? result.resultUrls.filter((value): value is string => typeof value === 'string')
    : undefined;

  return {
    resultUrls: urls,
    resultUrl: typeof result.resultUrl === 'string' ? result.resultUrl : undefined,
    mediaUrl: typeof result.mediaUrl === 'string' ? result.mediaUrl : undefined,
    resourceUrl: typeof result.resourceUrl === 'string' ? result.resourceUrl : undefined,
    // 添加更多可能的字段
    videoUrl: typeof result.videoUrl === 'string' ? result.videoUrl : undefined,
    outputUrl: typeof result.outputUrl === 'string' ? result.outputUrl : undefined,
    downloadUrl: typeof result.downloadUrl === 'string' ? result.downloadUrl : undefined,
    fileUrl: typeof result.fileUrl === 'string' ? result.fileUrl : undefined,
    url: typeof result.url === 'string' ? result.url : undefined,
  };
};

export const parseResultJson = (resultJson?: string | Record<string, unknown>): ParsedResultJson => {
  if (!resultJson) return {};

  if (typeof resultJson === 'object') {
    return normalizeResultPayload(resultJson);
  }

  try {
    const parsed = JSON.parse(resultJson);
    
    // 如果解析结果是数组，直接返回第一个元素作为resultUrls
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return {
        resultUrls: parsed.filter((value): value is string => typeof value === 'string'),
        resultUrl: parsed[0],
        mediaUrl: parsed[0],
        resourceUrl: parsed[0],
        videoUrl: parsed[0],
        outputUrl: parsed[0],
        downloadUrl: parsed[0],
        fileUrl: parsed[0],
        url: parsed[0]
      };
    }
    
    return normalizeResultPayload(parsed);
  } catch (_err) {
    return {};
  }
};
