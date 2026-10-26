import { runLLM } from "../ai/genai/llmNode";
import { ragNode } from "../ai/rag/ragNode";
import { runAgent } from "../ai/agent/agentNode";
import { assertSafeUrl } from "../utils/safeUrl";

export type ExecContext = {
  config: Record<string, string>;
  previous: string;
  userId: string;
  triggerPayload?: string | null;
  report?: (partial: Record<string, unknown>) => Promise<void>;
};

export type ExecResult = string | { text: string; trace?: unknown };

const HAS_PREVIOUS = /\{\{\s*previous\s*\}\}/;
const ALL_PREVIOUS = /\{\{\s*previous\s*\}\}/g;

function fill(template: string, previous: string) {
  return template.replace(ALL_PREVIOUS, previous);
}

export const executors: Record<string, (ctx: ExecContext) => Promise<ExecResult>> = {
    trigger: async ({ config, triggerPayload }) =>
    config.triggerType === "webhook" && triggerPayload ? triggerPayload : config.inputText ?? "",

  llm: async ({ config, previous }) => {
    let prompt = (config.prompt ?? "").trim();
    if (!prompt) throw new Error("This AI Prompt node has no prompt");
    if (HAS_PREVIOUS.test(prompt)) {
      prompt = fill(prompt, previous);
    } else if (previous) {
      prompt = `${prompt}\n\nInput:\n${previous}`;
    }
    return runLLM(prompt);
  },

  rag: async ({ config, previous, userId }) => ragNode(config, previous, userId),

  agent: async ({ config, previous, userId, report }) => runAgent(config, previous, userId, report),

  http: async ({ config, previous }) => {
    const url = fill(config.url ?? "", previous).trim();
    assertSafeUrl(url);
    const method = config.method === "POST" ? "POST" : "GET";
    const res = await fetch(url, {
      method,
      body: method === "POST" ? previous : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text.slice(0, 10000);
  },

  output: async ({ previous }) => previous,
};

export function evaluateCondition(config: Record<string, string>, previous: string): boolean {
  const text = previous.toLowerCase().trim();
  const value = (config.value ?? "").toLowerCase().trim();
  switch (config.operator) {
    case "does not contain":
      return !text.includes(value);
    case "equals":
      return text === value;
    case "is empty":
      return text === "";
    case "is not empty":
      return text !== "";
    default:
      return text.includes(value);
  }
}