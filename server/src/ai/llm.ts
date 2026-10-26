import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "../config/env";

export function getLLM() {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is missing in server/.env");
  }
  return new ChatGoogleGenerativeAI({
    model: env.geminiModel,
    apiKey: env.geminiApiKey,
    temperature: 0.3,
  });
}