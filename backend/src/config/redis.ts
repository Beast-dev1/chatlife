import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL;

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;
let redisDisabled = false;

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
    throw new Error("REDIS_URL is not set");
  }
  if (redisDisabled) {
    throw new Error("Redis is disabled for this process");
  }
  if (pubClient && subClient) {
    return { pubClient, subClient };
  }

  pubClient = createRedisClient(REDIS_URL);
  subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("Redis pub client error:", err));
  subClient.on("error", (err) => console.error("Redis sub client error:", err));

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
    await pubClient.quit();
    pubClient = null;
  }
  if (subClient) {
    await subClient.quit();
    subClient = null;
  }
}
