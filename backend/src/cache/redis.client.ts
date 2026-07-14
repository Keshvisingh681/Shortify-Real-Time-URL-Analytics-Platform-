import { createClient } from 'redis';
import { config } from '../config';

export const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('🔌 Connected to Redis');
  }
}
