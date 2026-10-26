import { assertSafeUrl } from "../../../utils/safeUrl";
import type { AgentTool } from "./types";

export const httpGetTool: AgentTool = {
  name: "http_get",
  description: "Fetch a public web page or JSON API with a GET request. Input: a full URL starting with https://",
  run: async (input) => {
    const url = input.trim();
    assertSafeUrl(url);
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return text.slice(0, 3000);
  },
};