"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsQueue = exports.AnalyticsQueue = void 0;
const redis_client_1 = require("../cache/redis.client");
const ANALYTICS_QUEUE_KEY = 'queue:analytics';
class AnalyticsQueue {
    /**
     * Pushes a click event to the Redis queue.
     * This is extremely fast (sub-millisecond O(1) LPUSH operation),
     * ensuring that the redirect response is not blocked by heavy DB writes.
     */
    async publish(event) {
        if (!redis_client_1.redisClient.isOpen) {
            console.warn('⚠️ Redis not connected. Dropping analytics event.');
            return;
        }
        try {
            await redis_client_1.redisClient.lPush(ANALYTICS_QUEUE_KEY, JSON.stringify(event));
        }
        catch (error) {
            console.error('Error queuing analytics event:', error);
        }
    }
    async pop() {
        if (!redis_client_1.redisClient.isOpen)
            return null;
        try {
            // Blocking pop or standard pop
            const data = await redis_client_1.redisClient.rPop(ANALYTICS_QUEUE_KEY);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error popping from queue:', error);
            return null;
        }
    }
}
exports.AnalyticsQueue = AnalyticsQueue;
exports.analyticsQueue = new AnalyticsQueue();
