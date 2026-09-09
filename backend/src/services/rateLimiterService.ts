import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

export interface RateLimitResult {
  allowed: boolean;
  delayToNextHourMs?: number;
  nextHour?: Date;
  reason?: string;
  exceededLimit?: 'user' | 'sender' | 'global';
}

export interface HourlyQuotaOptions {
  maxUserHourly?: number;
  maxSenderHourly?: number;
  maxGlobalHourly?: number;
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
   * Enforces hourly limits across user/tenant, sender, and global capacity atomically in Redis Lua.
   */
  static async acquireHourlyQuota(
    userId: string,
    senderIdOrOptions?: string | HourlyQuotaOptions | number | null,
    optionsOrMaxUser?: HourlyQuotaOptions | number
  ): Promise<RateLimitResult> {
    let senderId: string | null = null;
    let maxUserHourly = env.MAX_EMAILS_PER_HOUR;
    let maxSenderHourly = env.MAX_EMAILS_PER_SENDER_PER_HOUR;
    let maxGlobalHourly = env.MAX_GLOBAL_EMAILS_PER_HOUR;

    let opts: HourlyQuotaOptions | undefined;

    if (typeof senderIdOrOptions === 'string') {
      senderId = senderIdOrOptions;
      if (typeof optionsOrMaxUser === 'number') {
        maxUserHourly = optionsOrMaxUser;
      } else if (typeof optionsOrMaxUser === 'object' && optionsOrMaxUser !== null) {
        opts = optionsOrMaxUser;
      }
    } else if (typeof senderIdOrOptions === 'number') {
      maxUserHourly = senderIdOrOptions;
    } else if (typeof senderIdOrOptions === 'object' && senderIdOrOptions !== null) {
      opts = senderIdOrOptions;
    } else if (typeof optionsOrMaxUser === 'object' && optionsOrMaxUser !== null) {
      opts = optionsOrMaxUser;
    } else if (typeof optionsOrMaxUser === 'number') {
      maxUserHourly = optionsOrMaxUser;
    }

    if (opts) {
      if (opts.maxUserHourly !== undefined) maxUserHourly = opts.maxUserHourly;
      if (opts.maxSenderHourly !== undefined) maxSenderHourly = opts.maxSenderHourly;
      if (opts.maxGlobalHourly !== undefined) maxGlobalHourly = opts.maxGlobalHourly;
    }

    const currentHourTimestamp = Math.floor(Date.now() / 3600000) * 3600000;
    const userKey = `mailora:rate:hourly:user:${userId}:${currentHourTimestamp}`;
    const senderKey = senderId ? `mailora:rate:hourly:sender:${senderId}:${currentHourTimestamp}` : 'mailora:rate:hourly:none';
    const globalKey = `mailora:rate:hourly:global:${currentHourTimestamp}`;
    const ttlSeconds = 7200; // Keep keys for 2 hours

    const luaHourlyCheck = `
      local userKey = KEYS[1]
      local senderKey = KEYS[2]
      local globalKey = KEYS[3]

      local userLimit = tonumber(ARGV[1])
      local senderLimit = tonumber(ARGV[2])
      local globalLimit = tonumber(ARGV[3])
      local ttl = tonumber(ARGV[4])

      -- 1. Check user limit
      local userCount = tonumber(redis.call('get', userKey) or '0')
      if userCount >= userLimit then
          return 1
      end

      -- 2. Check sender limit (if senderKey provided)
      if senderKey ~= "mailora:rate:hourly:none" and senderLimit > 0 then
          local senderCount = tonumber(redis.call('get', senderKey) or '0')
          if senderCount >= senderLimit then
              return 2
          end
      end

      -- 3. Check global limit
      local globalCount = tonumber(redis.call('get', globalKey) or '0')
      if globalCount >= globalLimit then
          return 3
      end

      -- All checks passed! Perform atomic increments across all active keys
      local newUserCount = redis.call('incr', userKey)
      if newUserCount == 1 then
          redis.call('expire', userKey, ttl)
      end

      if senderKey ~= "mailora:rate:hourly:none" and senderLimit > 0 then
          local newSenderCount = redis.call('incr', senderKey)
          if newSenderCount == 1 then
              redis.call('expire', senderKey, ttl)
          end
      end

      local newGlobalCount = redis.call('incr', globalKey)
      if newGlobalCount == 1 then
          redis.call('expire', globalKey, ttl)
      end

      return 0
    `;

    const isAllowedCode = (await redisClient.eval(
      luaHourlyCheck,
      3,
      userKey,
      senderKey,
      globalKey,
      maxUserHourly.toString(),
      maxSenderHourly.toString(),
      maxGlobalHourly.toString(),
      ttlSeconds.toString()
    )) as number;

    if (isAllowedCode === 0) {
      return { allowed: true };
    }

    const nextHourTimestamp = currentHourTimestamp + 3600000;
    const delayToNextHourMs = Math.max(1000, nextHourTimestamp - Date.now());
    const nextHour = new Date(nextHourTimestamp);

    let reason = '';
    let exceededLimit: 'user' | 'sender' | 'global' = 'user';

    if (isAllowedCode === 1) {
      reason = `User hourly rate limit (${maxUserHourly} emails/hr) reached.`;
      exceededLimit = 'user';
    } else if (isAllowedCode === 2) {
      reason = `Sender hourly rate limit (${maxSenderHourly} emails/hr) reached.`;
      exceededLimit = 'sender';
    } else if (isAllowedCode === 3) {
      reason = `Global hourly rate limit (${maxGlobalHourly} emails/hr) reached.`;
      exceededLimit = 'global';
    }

    return {
      allowed: false,
      delayToNextHourMs,
      nextHour,
      reason,
      exceededLimit,
    };
  }
}
