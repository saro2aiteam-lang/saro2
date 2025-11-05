// Kie.ai API Error Code Mapping
// 根据Kie.ai API文档映射失败原因

export const KIE_ERROR_CODES = {
  // API级别错误
  '400': 'Invalid request parameters',
  '401': 'Authentication failed, please check API Key',
  '402': 'Insufficient account balance',
  '404': 'Resource not found',
  '422': 'Parameter validation failed',
  '429': 'Request rate limit exceeded',
  '500': 'Internal server error',
  
  // 任务级别错误（failCode字段）
  'MODEL_RATE_LIMIT': 'Model rate limit exceeded, please try again later',
  'MODEL_BUSY': 'Model is busy, suggest changing to 8s or try again later',
  'CONTENT_BLOCKED': 'Content violates usage policy, please modify and retry',
  'PROMPT_TOO_LONG': 'Prompt exceeds maximum length limit',
  'INVALID_ASPECT_RATIO': 'Invalid aspect ratio parameter',
  'IMAGE_UPLOAD_FAILED': 'Image upload failed',
  'GENERATION_TIMEOUT': 'Generation timeout',
  'UNKNOWN_ERROR': 'Unknown error occurred during generation',
} as const;

export type KieErrorCode = keyof typeof KIE_ERROR_CODES;

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(failCode?: string, failMsg?: string): string {
  // 优先使用API文档中的failMsg
  if (failMsg && failMsg.trim()) {
    return failMsg.trim();
  }
  
  // 使用预定义的错误代码映射
  if (failCode && failCode in KIE_ERROR_CODES) {
    return KIE_ERROR_CODES[failCode as KieErrorCode];
  }
  
  // 默认错误消息
  return 'Video generation failed. Please try again.';
}

/**
 * 判断是否为可重试的错误
 */
export function isRetryableError(failCode?: string): boolean {
  const retryableCodes = [
    'MODEL_RATE_LIMIT',
    'MODEL_BUSY',
    '429', // Rate limit
    '500', // Internal server error
  ];
  
  return failCode ? retryableCodes.includes(failCode) : false;
}

/**
 * 判断是否为内容政策错误
 */
export function isContentPolicyError(failCode?: string): boolean {
  const contentPolicyCodes = [
    'CONTENT_BLOCKED',
    '422', // Parameter validation failed
  ];
  
  return failCode ? contentPolicyCodes.includes(failCode) : false;
}




























