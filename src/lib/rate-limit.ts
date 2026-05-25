import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hasRedis } from "./env";

const memoryStore = new Map<string, { count: number; reset: number }>();

function memoryRateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.reset) {
    memoryStore.set(identifier, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!hasRedis()) return null;
  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
    });
  }
  return ratelimit;
}

export async function rateLimit(
  identifier: string,
  limit = 20
): Promise<{ success: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (rl) {
    const result = await rl.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  }
  return memoryRateLimit(identifier, limit, 60_000);
}
