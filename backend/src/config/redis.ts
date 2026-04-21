import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const NODE_ENV = process.env.NODE_ENV;

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;
let redisDisabled = false;

function getRedisErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  return "unknown Redis error";
}

function createRedisClient(url: string): RedisClientType {
  return createClient({
    url,
    socket: {
      // Fail fast and fall back to non-Redis mode.
      reconnectStrategy: false,
      connectTimeout: 3000,
    },
  });
}

export async function getRedisClients(): Promise<{
  pubClient: RedisClientType;
  subClient: RedisClientType;
}> {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is not set; running without Redis adapter");
  }
  if (
    NODE_ENV === "production" &&
    (REDIS_URL.includes("127.0.0.1") || REDIS_URL.includes("localhost") || REDIS_URL.includes("::1"))
  ) {
    throw new Error("REDIS_URL points to localhost in production; running without Redis adapter");
  }
  if (redisDisabled) {
    throw new Error("Redis is disabled for this process");
  }
  if (pubClient && subClient) {
    return { pubClient, subClient };
  }

  pubClient = createRedisClient(REDIS_URL);
  subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.warn(`Redis pub client error: ${getRedisErrorMessage(err)}`));
  subClient.on("error", (err) => console.warn(`Redis sub client error: ${getRedisErrorMessage(err)}`));

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    return { pubClient, subClient };
  } catch (err) {
    redisDisabled = true;
    await closeRedis();
    throw err;
  }
}

export async function closeRedis() {
  if (pubClient) {
    if (pubClient.isOpen) {
      try {
        await pubClient.quit();
      } catch {
        // Ignore close errors during Redis fallback/shutdown.
      }
    }
    pubClient = null;
  }
  if (subClient) {
    if (subClient.isOpen) {
      try {
        await subClient.quit();
      } catch {
        // Ignore close errors during Redis fallback/shutdown.
      }
    }
    subClient = null;
  }
}
