import { buildAgentGraph } from "./graph";
import type { TraceItem } from "./state";

export async function runAgent(
  config: Record<string, string>,
  previous: string,
  userId: string,
  report?: (partial: Record<string, unknown>) => Promise<void>
): Promise<{ text: string; trace: TraceItem[] }> {
  let goal = (config.goal ?? "").trim();
  if (!goal && !previous.trim()) {
    throw new Error("The agent has no goal. Write one in this node, or connect it after a node that outputs one.");
  }
  if (/\{\{\s*previous\s*\}\}/.test(goal)) {
    goal = goal.replace(/\{\{\s*previous\s*\}\}/g, previous);
  } else if (previous.trim()) {
    goal = goal ? `${goal}\n\nContext from the previous step:\n${previous}` : previous;
  }

  const maxSteps = Math.min(Math.max(Number(config.maxSteps) || 5, 1), 10);
  const graph = buildAgentGraph({ userId, maxSteps, report });

  const result = await graph.invoke(
    { goal, trace: [], finalAnswer: null },
    { recursionLimit: maxSteps * 2 + 6 }
  );

  return {
    text: result.finalAnswer ?? "The agent stopped without an answer.",
    trace: result.trace,
  };
}