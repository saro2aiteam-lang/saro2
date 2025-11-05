import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment counter
  current.count++;
  rateLimitMap.set(key, current);

  return {
    success: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

export function getRateLimitHeaders(result: ReturnType<typeof rateLimit>) {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

export function createRateLimitMiddleware(
  limit: number = 10,
  windowMs: number = 60000
) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const result = rateLimit(ip, limit, windowMs);

    if (!result.success) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: getRateLimitHeaders(result),
      });
    }

    return null; // Continue to next middleware
  };
}
