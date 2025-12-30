/**
 * In-memory rate limiter for Express
 * Tracks request counts per IP address with configurable limits and windows
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (req: any) => string; // Custom key generator (default: IP)
  skipSuccessfulRequests?: boolean; // Skip incrementing on success
  skipFailedRequests?: boolean; // Skip incrementing on error
}

const stores = new Map<string, RateLimitStore>();

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (req: any) => req.ip || req.connection.remoteAddress || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const storeKey = `${windowMs}-${max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, {});
  }
  const store = stores.get(storeKey)!;

  return (req: any, res: any, next: any) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset entry if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const entry = store[key];
    const remaining = Math.max(0, max - entry.count);
    const resetTime = entry.resetTime;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Increment count
    entry.count += 1;

    // Check if limit exceeded
    if (entry.count > max) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
      return;
    }

    // Store original send for tracking success/failure
    const originalSend = res.send;
    res.send = function (data: any) {
      if (res.statusCode >= 400) {
        if (!skipFailedRequests) {
          // Already incremented above, don't double count
        }
      } else {
        if (skipSuccessfulRequests) {
          entry.count -= 1; // Decrement if we should skip
        }
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Start a periodic cleanup job to remove expired entries from all stores
 */
export function startRateLimitStoreCleanup(intervalMs: number = 60000) {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let totalCleaned = 0;

    stores.forEach((store) => {
      const keys = Object.keys(store);
      keys.forEach((key) => {
        if (store[key].resetTime < now) {
          delete store[key];
          totalCleaned += 1;
        }
      });
    });

    if (totalCleaned > 0) {
      console.log(`[Rate Limiter] Cleaned up ${totalCleaned} expired entries`);
    }
  }, intervalMs);

  // Don't keep process alive for cleanup interval
  cleanupInterval.unref?.();

  return cleanupInterval;
}
