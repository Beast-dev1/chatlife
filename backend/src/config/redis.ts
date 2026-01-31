import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;

export async function getRedisClients(): Promise<{
  pubClient: RedisClientType;
  subClient: RedisClientType;
}> {
  if (pubClient && subClient) {
    return { pubClient, subClient };
  }

  pubClient = createClient({ url: REDIS_URL });
  subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("Redis pub client error:", err));
  subClient.on("error", (err) => console.error("Redis sub client error:", err));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  return { pubClient, subClient };
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
