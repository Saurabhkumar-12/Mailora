import { Redis, RedisOptions } from 'ioredis';
import { env } from './env.js';

export const getCleanRedisUrl = (): string => {
  let url = env.REDIS_URL.trim();
  const cliMatch = url.match(/-u\s+([^\s]+)/);
  if (cliMatch && cliMatch[1]) {
    url = cliMatch[1];
  }
  if (url.includes('upstash.io') && url.startsWith('redis://')) {
    url = url.replace('redis://', 'rediss://');
  }
  return url;
};

/**
 * Common connection options required for BullMQ queues and workers.
 * BullMQ strictly requires `maxRetriesPerRequest: null`.
 */
export const getRedisConnectionOptions = (): RedisOptions => {
  const cleanUrl = getCleanRedisUrl();
  const isTls = cleanUrl.startsWith('rediss://');

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  return options;
};

// Singleton Redis client instance for direct operations (health checks, atomic counters, etc.)
const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

export const redisClient =
  globalForRedis.redisClient ??
  new Redis(getCleanRedisUrl(), getRedisConnectionOptions());

if (env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redisClient;
}

redisClient.on('error', (err) => {
  console.error('[Redis Error]:', err.message);
});

redisClient.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('✅ Connected to Redis successfully');
  }
});
