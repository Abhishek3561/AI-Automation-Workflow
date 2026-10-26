import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function splitText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });
  const chunks = await splitter.splitText(text);
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}