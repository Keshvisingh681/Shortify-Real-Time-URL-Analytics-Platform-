"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlCache = exports.UrlCache = void 0;
const redis_client_1 = require("./redis.client");
const CACHE_PREFIX = 'url:';
const DEFAULT_TTL = 3600; // 1 hour in seconds
/**
 * Cache Manager implementing the Cache-Aside pattern.
 * Caches short URLs using their shortCode for sub-millisecond retrieval.
 */
class UrlCache {
    getCacheKey(shortCode) {
        return `${CACHE_PREFIX}${shortCode}`;
    }
    async get(shortCode) {
        if (!redis_client_1.redisClient.isOpen)
            return null;
        try {
            const data = await redis_client_1.redisClient.get(this.getCacheKey(shortCode));
            if (!data)
                return null;
            // Parse dates because JSON.stringify serializes Date objects to strings
            const url = JSON.parse(data);
            if (url.expiresAt)
                url.expiresAt = new Date(url.expiresAt);
            if (url.createdAt)
                url.createdAt = new Date(url.createdAt);
            if (url.updatedAt)
                url.updatedAt = new Date(url.updatedAt);
            return url;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    async set(shortCode, urlData, ttl = DEFAULT_TTL) {
        if (!redis_client_1.redisClient.isOpen)
            return;
        try {
            await redis_client_1.redisClient.set(this.getCacheKey(shortCode), JSON.stringify(urlData), {
                EX: ttl,
            });
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async invalidate(shortCode) {
        if (!redis_client_1.redisClient.isOpen)
            return;
        try {
            await redis_client_1.redisClient.del(this.getCacheKey(shortCode));
        }
        catch (error) {
            console.error('Cache invalidate error:', error);
        }
    }
}
exports.UrlCache = UrlCache;
exports.urlCache = new UrlCache();
