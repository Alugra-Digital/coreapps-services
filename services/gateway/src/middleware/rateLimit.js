import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../../../shared/cache/redis.js';

export async function createRateLimiter() {
  try {
    const client = await getRedisClient();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        client,
        prefix: 'rl:'
      }),
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After')
        });
      },
      keyGenerator: (req) => {
        // Rate limit by user ID (if authenticated) or IP
        return req.user?.id || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api-docs';
      }
    });
  } catch (error) {
    console.warn('⚠️  Rate limiter initialization failed, using memory store:', error.message);
    
    // Fallback to memory store if Redis is unavailable
    return rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After')
        });
      }
    });
  }
}

// Stricter rate limiting for auth endpoints
export async function createAuthRateLimiter() {
  try {
    const client = await getRedisClient();
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts
      store: new RedisStore({ client, prefix: 'rl:auth:' }),
      skipSuccessfulRequests: true,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many authentication attempts, please try again later',
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After')
        });
      }
    });
  } catch (error) {
    console.warn('⚠️  Auth rate limiter initialization failed, using memory store:', error.message);
    
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many authentication attempts, please try again later',
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          retryAfter: res.getHeader('Retry-After')
        });
      }
    });
  }
}
