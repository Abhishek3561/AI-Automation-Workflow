import { env } from "../../config/env";

// must match vector(768) in the database
export const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is missing in server/.env");

  const model = env.geminiEmbeddingModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.geminiApiKey },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        })),
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { embeddings: { values: number[] }[] };
      const vectors = data.embeddings.map((e) => e.values);
      if (vectors.some((v) => v.length !== EMBEDDING_DIMENSIONS)) {
        throw new Error(`Embedding size is not ${EMBEDDING_DIMENSIONS}. Check GEMINI_EMBEDDING_MODEL.`);
      }
      return vectors;
    }

    const body = await res.text();
    if ([429, 500, 503].includes(res.status) && attempt < 4) {
      await sleep(1500 * attempt);
      continue;
    }
    throw new Error(`Embedding request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  throw new Error("Embedding request failed");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    all.push(...(await embedBatch(texts.slice(i, i + BATCH_SIZE))));
  }
  return all;
}