import { env } from "../config/env";

const url = new URL(env.redisUrl);

export const redisConnection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  maxRetriesPerRequest: null as null,
};