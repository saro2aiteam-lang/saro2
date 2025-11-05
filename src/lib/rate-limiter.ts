/**
 * Rate Limiter for API Routes
 * 
 * Implements token bucket algorithm for rate limiting
 * Stores rate limit data in memory (use Redis in production for multi-instance deployments)
 */

interface RateLimitConfig {
  interval: number;  // Time window in milliseconds
  uniqueTokenPerInterval: number;  // Max number of unique tokens (IPs/users) to track
  maxRequests: number;  // Max requests per interval
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private cache: Map<string, TokenBucket>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.cache = new Map();
    this.config = config;

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.config.interval);
  }

  /**
   * Check if request should be rate limited
   * @param key - Unique identifier (IP address, user ID, etc.)
   * @returns Object with allowed status and remaining tokens
   */
  async check(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    let bucket = this.cache.get(key);

    if (!bucket) {
      // First request from this key
      bucket = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      };
      this.cache.set(key, bucket);
      
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + this.config.interval,
      };
    }

    // Calculate how many tokens to refill based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = Math.floor(
      (timePassed / this.config.interval) * this.config.maxRequests
    );

    if (refillAmount > 0) {
      bucket.tokens = Math.min(
        this.config.maxRequests,
        bucket.tokens + refillAmount
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: bucket.lastRefill + this.config.interval,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.lastRefill + this.config.interval,
    };
  }

  /**
   * Clean up old entries to prevent memory leak
   */
  private cleanup() {
    const now = Date.now();
    const expirationTime = this.config.interval * 2;

    for (const [key, bucket] of this.cache.entries()) {
      if (now - bucket.lastRefill > expirationTime) {
        this.cache.delete(key);
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.config.uniqueTokenPerInterval) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.lastRefill - b.lastRefill
      );
      
      const toRemove = this.cache.size - this.config.uniqueTokenPerInterval;
      sortedEntries.slice(0, toRemove).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing)
   */
  reset(key: string) {
    this.cache.delete(key);
  }

  /**
   * Get current stats for a key
   */
  getStats(key: string) {
    const bucket = this.cache.get(key);
    if (!bucket) {
      return {
        tokens: this.config.maxRequests,
        lastRefill: 0,
      };
    }
    return { ...bucket };
  }
}

// Rate limiter instances for different endpoints
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Track 500 unique IPs
  maxRequests: 60, // 60 requests per minute
});

export const videoGenerationRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 5, // 5 video generations per minute (more restrictive)
});

export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
  maxRequests: 5, // 5 auth attempts per 15 minutes
});

/**
 * Helper to get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'fastly-client-ip', // Fastly
    'x-client-ip',
    'x-cluster-client-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

/**
 * Middleware helper for rate limiting in API routes
 */
export async function rateLimit(
  request: Request,
  limiter: RateLimiter = apiRateLimiter,
  identifier?: string
): Promise<Response | null> {
  const key = identifier || getClientIp(request);
  const result = await limiter.check(key);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limiter.getStats(key).tokens.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  return null; // No rate limit hit, continue processing
}

export default RateLimiter;

