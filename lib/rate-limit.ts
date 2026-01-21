import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS, HTTP_STATUS } from './constants';
import { isProduction } from './env';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

const defaultConfig: RateLimitConfig = {
  interval: RATE_LIMITS.API.INTERVAL,
  uniqueTokenPerInterval: isProduction 
    ? RATE_LIMITS.API.MAX_REQUESTS_PROD 
    : RATE_LIMITS.API.MAX_REQUESTS_DEV,
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { interval, uniqueTokenPerInterval } = { ...defaultConfig, ...config };

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get identifier (IP address or user ID)
    const identifier = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'anonymous';

    const now = Date.now();
    const resetTime = now + interval;

    // Initialize or get existing rate limit data
    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 0,
        resetTime,
      };
    }

    // Increment request count
    store[identifier].count++;

    // Check if rate limit exceeded
    if (store[identifier].count > uniqueTokenPerInterval) {
      const retryAfter = Math.ceil((store[identifier].resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': uniqueTokenPerInterval.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[identifier].resetTime.toString(),
          },
        }
      );
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
          delete store[key];
        }
      });
    }

    return null; // No rate limit hit
  };
}

// Preset rate limiters
export const authRateLimit = rateLimit({
  interval: RATE_LIMITS.AUTH.INTERVAL,
  uniqueTokenPerInterval: isProduction 
    ? RATE_LIMITS.AUTH.MAX_REQUESTS_PROD 
    : RATE_LIMITS.AUTH.MAX_REQUESTS_DEV,
});

export const apiRateLimit = rateLimit({
  interval: RATE_LIMITS.API.INTERVAL,
  uniqueTokenPerInterval: isProduction 
    ? RATE_LIMITS.API.MAX_REQUESTS_PROD 
    : RATE_LIMITS.API.MAX_REQUESTS_DEV,
});

export const strictRateLimit = rateLimit({
  interval: RATE_LIMITS.STRICT.INTERVAL,
  uniqueTokenPerInterval: isProduction 
    ? RATE_LIMITS.STRICT.MAX_REQUESTS_PROD 
    : RATE_LIMITS.STRICT.MAX_REQUESTS_DEV,
});
