import Redis from "ioredis";
import config from "./env.js";

let redis = null;

if (config.redisUrl) {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    tls: config.redisUrl.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
  });
  redis.on("connect", () => console.log("Connected to Redis"));
  redis.on("error", (e) => console.error("Redis error:", e));
} else {
  console.warn("REDIS_URL not set — running without Redis");
}

export default redis;
