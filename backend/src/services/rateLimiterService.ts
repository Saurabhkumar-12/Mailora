import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

export interface RateLimitResult {
  allowed: boolean;
  delayToNextHourMs?: number;
  nextHour?: Date;
  reason?: string;
}

export class RateLimiterService {
  /**
   * Enforces global minimum send delay across all worker instances atomically in Redis.
   */
  static async enforceMinSendDelay(minDelayMs: number = env.MIN_SEND_DELAY_MS): Promise<number> {
    if (minDelayMs <= 0) return 0;

    const luaMinDelay = `
      local key = KEYS[1]
      local minDelay = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local lastSend = tonumber(redis.call('get', key) or '0')

      local nextAllowed = math.max(now, lastSend + minDelay)
      redis.call('set', key, nextAllowed)
      return nextAllowed - now
    `;

    const now = Date.now();
    const delayNeeded = (await redisClient.eval(
      luaMinDelay,
      1,
      'mailora:rate:min_send_delay',
      minDelayMs.toString(),
      now.toString()
    )) as number;

    if (delayNeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    return delayNeeded;
  }

  /**
   * Enforces hourly limit per user/sender (and optionally global capacity) atomically in Redis.
   */
  static async acquireHourlyQuota(
    userId: string,
    maxHourly: number = env.MAX_EMAILS_PER_HOUR
  ): Promise<RateLimitResult> {
    const currentHourTimestamp = Math.floor(Date.now() / 3600000) * 3600000;
    const userKey = `mailora:rate:hourly:user:${userId}:${currentHourTimestamp}`;
    const ttlSeconds = 7200; // Keep key for 2 hours

    const luaHourlyCheck = `
      local userKey = KEYS[1]
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])

      local userCount = tonumber(redis.call('get', userKey) or '0')

      if userCount >= limit then
          return 0
      end

      local newUserCount = redis.call('incr', userKey)
      if newUserCount == 1 then
          redis.call('expire', userKey, ttl)
      end

      return 1
    `;

    const isAllowed = (await redisClient.eval(
      luaHourlyCheck,
      1,
      userKey,
      maxHourly.toString(),
      ttlSeconds.toString()
    )) as number;

    if (isAllowed === 1) {
      return { allowed: true };
    }

    const nextHourTimestamp = currentHourTimestamp + 3600000;
    const delayToNextHourMs = Math.max(1000, nextHourTimestamp - Date.now());
    const nextHour = new Date(nextHourTimestamp);

    return {
      allowed: false,
      delayToNextHourMs,
      nextHour,
      reason: `Hourly rate limit (${maxHourly} emails/hr) reached.`,
    };
  }
}
