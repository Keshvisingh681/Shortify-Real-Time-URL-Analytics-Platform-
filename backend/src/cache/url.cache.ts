import { redisClient } from './redis.client';
import { ShortUrl } from '@prisma/client';

const CACHE_PREFIX = 'url:';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Cache Manager implementing the Cache-Aside pattern.
 * Caches short URLs using their shortCode for sub-millisecond retrieval.
 */
export class UrlCache {
  private getCacheKey(shortCode: string): string {
    return `${CACHE_PREFIX}${shortCode}`;
  }

  async get(shortCode: string): Promise<ShortUrl | null> {
    if (!redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(this.getCacheKey(shortCode));
      if (!data) return null;
      
      // Parse dates because JSON.stringify serializes Date objects to strings
      const url = JSON.parse(data);
      if (url.expiresAt) url.expiresAt = new Date(url.expiresAt);
      if (url.createdAt) url.createdAt = new Date(url.createdAt);
      if (url.updatedAt) url.updatedAt = new Date(url.updatedAt);
      
      return url as ShortUrl;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(shortCode: string, urlData: ShortUrl, ttl = DEFAULT_TTL): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.set(this.getCacheKey(shortCode), JSON.stringify(urlData), {
        EX: ttl,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(shortCode: string): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.del(this.getCacheKey(shortCode));
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
export const urlCache = new UrlCache();
