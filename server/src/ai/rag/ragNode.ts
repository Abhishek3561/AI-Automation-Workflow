import { runLLM } from "../genai/llmNode";
import { searchChunks } from "./vectorStore";

export async function ragNode(
  config: Record<string, string>,
  previous: string,
  userId: string
): Promise<string> {
  const template = (config.question ?? "").trim();
  const question = template
    ? template.replace(/\{\{\s*previous\s*\}\}/g, previous)
    : previous.trim();

  if (!question) {
    throw new Error("No question. Write one in this node, or connect it after a node that outputs one.");
  }

  const topK = Math.min(Math.max(Number(config.topK) || 4, 1), 10);
  const hits = await searchChunks(userId, question, topK);
  if (hits.length === 0) {
    throw new Error("You have no documents yet. Upload one on the Documents page first.");
  }

  const context = hits.map((h, i) => `[${i + 1}] (file: ${h.filename})\n${h.content}`).join("\n\n");

  const prompt = `You answer questions using only the context below.
If the context does not contain the answer, say you could not find it in the documents.
Mention the sources you used like [1], [2].

Context:
${context}

Question: ${question}`;

  const answer = await runLLM(prompt);
  const sources = hits
    .map((h, i) => `[${i + 1}] ${h.filename} (part ${h.chunkIndex + 1}, similarity ${h.score.toFixed(2)})`)
    .join("\n");

  return `${answer}\n\nSources:\n${sources}`;
}