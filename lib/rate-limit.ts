import { Redis } from "@upstash/redis";
import type { UserPlan } from "@prisma/client";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
};

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

function planLimit(plan: UserPlan): number | null {
  if (plan === "FREE") return 100;
  if (plan === "BASIC") return 1000;
  return null;
}

export async function checkRateLimit(userId: string, plan: UserPlan, routeKey: string): Promise<RateLimitResult> {
  const limit = planLimit(plan);
  if (!limit) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, resetAt: null };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: limit, resetAt: null };
  }

  const currentWindow = Math.floor(Date.now() / 60_000);
  const key = `envarmor:rate:${routeKey}:${userId}:${currentWindow}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 120);
  }

  const remaining = Math.max(0, limit - count);
  return {
    allowed: count <= limit,
    remaining,
    resetAt: new Date((currentWindow + 1) * 60_000)
  };
}
