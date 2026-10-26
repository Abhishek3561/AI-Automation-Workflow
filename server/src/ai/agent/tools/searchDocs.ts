import { searchChunks } from "../../rag/vectorStore";
import type { AgentTool } from "./types";

export const searchDocsTool: AgentTool = {
  name: "search_documents",
  description:
    "Search the user's uploaded documents (policies, manuals, notes). Input: a short natural-language search query.",
  run: async (input, { userId }) => {
    const hits = await searchChunks(userId, input, 4);
    if (hits.length === 0) return "No documents found. The user has not uploaded any documents.";
    return hits.map((h, i) => `[${i + 1}] (${h.filename}) ${h.content}`).join("\n\n");
  },
};