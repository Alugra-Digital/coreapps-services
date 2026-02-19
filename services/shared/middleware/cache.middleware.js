import { cacheGet, cacheSet } from '../cache/redis.js';

export function cacheMiddleware(ttlSeconds = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${req.user?.id || 'anon'}`;
    
    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.set('X-Cache', 'HIT').json(cached);
      }
      
      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await cacheSet(cacheKey, body, ttlSeconds);
        }
        res.set('X-Cache', 'MISS');
        return originalJson(body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
}
