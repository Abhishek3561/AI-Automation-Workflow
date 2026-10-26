import { getLLM } from "../llm";

export async function runLLM(prompt: string): Promise<string> {
  const res = await getLLM().invoke(prompt);
  const content = res.content;
  if (typeof content === "string") return content;
  return content.map((part) => (part as { text?: string }).text ?? "").join("");
}