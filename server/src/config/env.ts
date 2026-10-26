import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
  databaseUrl: process.env.DATABASE_URL || "",
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is missing in server/.env");
}