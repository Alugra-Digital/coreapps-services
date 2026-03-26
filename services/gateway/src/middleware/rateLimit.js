import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../../../shared/cache/redis.js';

// Skip rate limiting for loopback and Docker bridge IPs.
// In production the gateway sits behind Nginx which forwards real client IPs;
// internal/host traffic from localhost or Docker networks is always trusted.
function isInternalIp(rawIp = '') {
  // Normalize IPv6-mapped IPv4 (e.g. "::ffff:172.18.0.1" → "172.18.0.1")
  const ip = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') || ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') || ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') || ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') || ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') || ip.startsWith('172.31.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.')
  );
}

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
        // Skip for health checks and internal/Docker network traffic
        return req.path === '/health' || req.path === '/api-docs' || isInternalIp(req.ip);
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
      skip: (req) => {
        return req.path === '/health' || req.path === '/api-docs' || isInternalIp(req.ip);
      },
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
      skip: (req) => isInternalIp(req.ip),
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
      skip: (req) => isInternalIp(req.ip),
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
