import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    retryStrategy: (times) => {
      // If Redis is not available (dev mode), stop retrying after 3 times to avoid spamming logs
      // In production, we might want to retry indefinitely
      if (process.env.NODE_ENV !== "production" && times > 3) {
        console.warn("Redis connection failed. Falling back to in-memory mode (mock).");
        return null;
      }
      return Math.min(times * 50, 2000);
    },
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Mock implementation for development without Redis
const memoryStore = new Map<string, string>();

export async function setGame(key: string, data: any, expireSeconds = 3600) {
  try {
    if (redis.status === "ready") {
      await redis.setex(key, expireSeconds, JSON.stringify(data));
    } else {
      memoryStore.set(key, JSON.stringify(data));
    }
  } catch (e) {
    memoryStore.set(key, JSON.stringify(data));
  }
}

export async function getGame<T>(key: string): Promise<T | null> {
  try {
    let data: string | null = null;
    if (redis.status === "ready") {
      data = await redis.get(key);
    } else {
      data = memoryStore.get(key) || null;
    }
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export async function delGame(key: string) {
  try {
    if (redis.status === "ready") {
      await redis.del(key);
    } else {
      memoryStore.delete(key);
    }
  } catch (e) {}
}
