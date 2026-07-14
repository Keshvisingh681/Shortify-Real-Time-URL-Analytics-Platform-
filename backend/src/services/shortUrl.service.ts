import { ShortUrlRepository, ListUrlsParams } from '../repositories/shortUrl.repository';
import { generateBase62Code } from '../utils/base62';
import { urlCache } from '../cache/url.cache';
import { ShortUrl } from '@prisma/client';

export class ShortUrlService {
  private repository = new ShortUrlRepository();

  /**
   * Creates a new short URL.
   * Handles custom alias uniqueness and Base62 collision detection with retry logic.
   */
  async createShortUrl(params: {
    userId: string;
    longUrl: string;
    customAlias?: string;
    expiresAt?: Date | null;
  }): Promise<ShortUrl> {
    const { userId, longUrl, customAlias, expiresAt } = params;

    let shortCode: string | undefined = customAlias;

    if (customAlias) {
      // Custom alias checks must be strict - no auto-regeneration.
      const existing = await this.repository.findByShortCode(customAlias);
      if (existing) {
        throw new Error('Custom alias is already in use');
      }
    } else {
      // Collision detection with retry logic
      const maxRetries = 5;
      let retries = 0;
      let generatedCode = '';
      
      while (retries < maxRetries) {
        generatedCode = generateBase62Code(6);
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
      shortCode: shortCode!,
      expiresAt: expiresAt || null,
      userId,
    });

    // Cache the newly created URL
    await urlCache.set(shortCode!, shortUrl);

    return shortUrl;
  }

  async getShortUrlByCode(shortCode: string): Promise<ShortUrl | null> {
    // 1. Check Redis Cache first
    let shortUrl = await urlCache.get(shortCode);

    if (!shortUrl) {
      console.log(`Cache miss for shortCode: ${shortCode}`);
      // 2. Database query on cache miss
      shortUrl = await this.repository.findByShortCode(shortCode);

      if (shortUrl) {
        // 3. Cache-aside write back
        await urlCache.set(shortCode, shortUrl);
      }
    } else {
      console.log(`Cache hit for shortCode: ${shortCode}`);
    }

    return shortUrl;
  }

  async updateShortUrl(params: {
    id: string;
    userId: string;
    longUrl?: string;
    isEnabled?: boolean;
    expiresAt?: Date | null;
  }): Promise<ShortUrl> {
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
    await urlCache.invalidate(existing.shortCode);

    return updated;
  }

  async deleteShortUrl(id: string, userId: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Short URL not found');
    }
    if (existing.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.repository.delete(id);

    // Invalidate cache
    await urlCache.invalidate(existing.shortCode);
  }

  async listUrls(params: ListUrlsParams) {
    return this.repository.list(params);
  }
}
export const shortUrlService = new ShortUrlService();
