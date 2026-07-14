import { redisClient } from '../cache/redis.client';

export interface ClickEventPayload {
  shortUrlId: string;
  ip: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
}

const ANALYTICS_QUEUE_KEY = 'queue:analytics';

export class AnalyticsQueue {
  /**
   * Pushes a click event to the Redis queue.
   * This is extremely fast (sub-millisecond O(1) LPUSH operation),
   * ensuring that the redirect response is not blocked by heavy DB writes.
   */
  async publish(event: ClickEventPayload): Promise<void> {
    if (!redisClient.isOpen) {
      console.warn('⚠️ Redis not connected. Dropping analytics event.');
      return;
    }
    try {
      await redisClient.lPush(ANALYTICS_QUEUE_KEY, JSON.stringify(event));
    } catch (error) {
      console.error('Error queuing analytics event:', error);
    }
  }

  async pop(): Promise<ClickEventPayload | null> {
    if (!redisClient.isOpen) return null;
    try {
      // Blocking pop or standard pop
      const data = await redisClient.rPop(ANALYTICS_QUEUE_KEY);
      if (!data) return null;
      return JSON.parse(data) as ClickEventPayload;
    } catch (error) {
      console.error('Error popping from queue:', error);
      return null;
    }
  }
}

export const analyticsQueue = new AnalyticsQueue();
