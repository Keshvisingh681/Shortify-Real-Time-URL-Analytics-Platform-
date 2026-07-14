"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortUrlService = exports.ShortUrlService = void 0;
const shortUrl_repository_1 = require("../repositories/shortUrl.repository");
const base62_1 = require("../utils/base62");
const url_cache_1 = require("../cache/url.cache");
class ShortUrlService {
    repository = new shortUrl_repository_1.ShortUrlRepository();
    /**
     * Creates a new short URL.
     * Handles custom alias uniqueness and Base62 collision detection with retry logic.
     */
    async createShortUrl(params) {
        const { userId, longUrl, customAlias, expiresAt } = params;
        let shortCode = customAlias;
        if (customAlias) {
            // Custom alias checks must be strict - no auto-regeneration.
            const existing = await this.repository.findByShortCode(customAlias);
            if (existing) {
                throw new Error('Custom alias is already in use');
            }
        }
        else {
            // Collision detection with retry logic
            const maxRetries = 5;
            let retries = 0;
            let generatedCode = '';
            while (retries < maxRetries) {
                generatedCode = (0, base62_1.generateBase62Code)(6);
                const existing = await this.repository.findByShortCode(generatedCode);
                if (!existing) {
                    shortCode = generatedCode;
                    break;
                }
                retries++;
            }
            if (!shortCode) {
                throw new Error('Failed to generate a unique short code. Please try again.');
            }
        }
        const shortUrl = await this.repository.create({
            longUrl,
            shortCode: shortCode,
            expiresAt: expiresAt || null,
            userId,
        });
        // Cache the newly created URL
        await url_cache_1.urlCache.set(shortCode, shortUrl);
        return shortUrl;
    }
    async getShortUrlByCode(shortCode) {
        // 1. Check Redis Cache first
        let shortUrl = await url_cache_1.urlCache.get(shortCode);
        if (!shortUrl) {
            console.log(`Cache miss for shortCode: ${shortCode}`);
            // 2. Database query on cache miss
            shortUrl = await this.repository.findByShortCode(shortCode);
            if (shortUrl) {
                // 3. Cache-aside write back
                await url_cache_1.urlCache.set(shortCode, shortUrl);
            }
        }
        else {
            console.log(`Cache hit for shortCode: ${shortCode}`);
        }
        return shortUrl;
    }
    async updateShortUrl(params) {
        const { id, userId, longUrl, isEnabled, expiresAt } = params;
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Short URL not found');
        }
        if (existing.userId !== userId) {
            throw new Error('Unauthorized');
        }
        const updated = await this.repository.update(id, {
            ...(longUrl !== undefined ? { longUrl } : {}),
            ...(isEnabled !== undefined ? { isEnabled } : {}),
            ...(expiresAt !== undefined ? { expiresAt } : {}),
        });
        // Invalidate the cache for this shortCode
        await url_cache_1.urlCache.invalidate(existing.shortCode);
        return updated;
    }
    async deleteShortUrl(id, userId) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Short URL not found');
        }
        if (existing.userId !== userId) {
            throw new Error('Unauthorized');
        }
        await this.repository.delete(id);
        // Invalidate cache
        await url_cache_1.urlCache.invalidate(existing.shortCode);
    }
    async listUrls(params) {
        return this.repository.list(params);
    }
}
exports.ShortUrlService = ShortUrlService;
exports.shortUrlService = new ShortUrlService();
