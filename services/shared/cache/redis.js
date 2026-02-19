import { createClient } from 'redis';

let client;
let isConnecting = false;

export async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }
  
  if (isConnecting) {
    // Wait for connection to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return getRedisClient();
  }
  
  isConnecting = true;
  
  try {
    client = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    client.on('error', (err) => console.error('❌ Redis Client Error:', err));
    client.on('connect', () => console.log('🔗 Redis connected'));
    client.on('ready', () => console.log('✅ Redis ready'));
    client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
    
    await client.connect();
    isConnecting = false;
    return client;
  } catch (error) {
    isConnecting = false;
    console.error('❌ Failed to connect to Redis:', error.message);
    throw error;
  }
}

export async function cacheGet(key) {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis cacheGet error:', error.message);
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis cacheSet error:', error.message);
  }
}

export async function cacheInvalidate(pattern) {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis cacheInvalidate error:', error.message);
  }
}

export async function disconnect() {
  if (client && client.isOpen) {
    await client.quit();
  }
}
