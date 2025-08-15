interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(req: Request): { allowed: boolean; retryAfter?: number } {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    const record = store[key];
    
    if (!record) {
      // First request for this key
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return { allowed: true };
    }
    
    if (now > record.resetTime) {
      // Window has expired, reset
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return { allowed: true };
    }
    
    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Increment counter
    record.count++;
    return { allowed: true };
  }

  private getDefaultKey(req: Request): string {
    // Use Cloudflare connecting IP header if available
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const remoteAddr = req.headers.get('x-real-ip');
    
    return cfConnectingIp || xForwardedFor?.split(',')[0] || remoteAddr || 'unknown';
  }

  private cleanup(now: number) {
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }
}

// Pre-configured rate limiters
export const ipRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60
});

export const userRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => {
    // Extract user ID from Authorization header
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fall back to IP if JWT parsing fails
        return ipRateLimit['getDefaultKey'](req);
      }
    }
    return ipRateLimit['getDefaultKey'](req);
  }
});

export function createRateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      retryAfter 
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}