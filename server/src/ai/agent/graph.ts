import { StateGraph, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { runLLM } from "../genai/llmNode";
import { AgentState, type TraceItem } from "./state";
import { allTools } from "./tools";

export type AgentContext = {
  userId: string;
  maxSteps: number;
  report?: (partial: Record<string, unknown>) => Promise<void>;
};

const decisionSchema = z.object({
  thought: z.string(),
  action: z.string(),
  input: z.any(),
});

function parseDecision(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object found");
  const d = decisionSchema.parse(JSON.parse(text.slice(start, end + 1)));
  const input = typeof d.input === "string" ? d.input : JSON.stringify(d.input ?? "");
  return { thought: d.thought, action: d.action.trim(), input };
}

function scratchpad(trace: TraceItem[]) {
  if (trace.length === 0) return "(none yet)";
  return trace
    .map(
      (t) =>
        `Step ${t.step}\nThought: ${t.thought}\nAction: ${t.action}\nInput: ${t.input}\nObservation: ${t.observation ?? ""}`
    )
    .join("\n\n");
}

export function buildAgentGraph(ctx: AgentContext) {
  const toolMap = new Map(allTools.map((t) => [t.name, t]));
  const toolList = allTools.map((t) => `- ${t.name}: ${t.description}`).join("\n");

  function buildPrompt(goal: string, trace: TraceItem[], forceFinish: boolean) {
    return `You are an agent that solves a goal step by step using tools.

Goal:
${goal}

Available actions:
${toolList}
- finish: Use this when you can give the final answer. Put the complete answer in "input".

Previous steps:
${scratchpad(trace)}

Rules:
- Choose exactly ONE action per step.
- Use only facts from tool results. Never invent data.
- If a tool returns an error, correct your input or try another approach.
${forceFinish ? "- You have used all your steps. You MUST use the finish action now.\n" : ""}
Reply with ONLY a JSON object and nothing else:
{"thought": "short reasoning", "action": "action name", "input": "tool input or final answer"}`;
  }

  async function decide(prompt: string) {
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const extra = attempt > 0 ? "\n\nYour last reply was not valid JSON. Reply with only the JSON object." : "";
      const text = await runLLM(prompt + extra);
      try {
        return parseDecision(text);
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    throw new Error(`The model did not return a valid next step (${lastError})`);
  }

  // THINK: ask the model what to do next
  const think = async (state: typeof AgentState.State) => {
    const forceFinish = state.trace.length >= ctx.maxSteps;
    const decision = await decide(buildPrompt(state.goal, state.trace, forceFinish));

    if (forceFinish && decision.action !== "finish") {
      const found = state.trace.map((t) => t.observation ?? "").join("\n").slice(0, 1500);
      decision.action = "finish";
      decision.input = `I reached my step limit before finishing. What I found so far:\n${found}`;
    }

    const item: TraceItem = {
      step: state.trace.length + 1,
      thought: decision.thought,
      action: decision.action,
      input: decision.input,
    };
    const trace = [...state.trace, item];
    await ctx.report?.({ text: "", trace });
    return { trace, finalAnswer: decision.action === "finish" ? decision.input : null };
  };

  // ACT: run the chosen tool and record what came back
  const act = async (state: typeof AgentState.State) => {
    const last = state.trace[state.trace.length - 1];
    const tool = toolMap.get(last.action);
    let observation: string;
    if (!tool) {
      observation = `Unknown action "${last.action}". Available actions: ${[...toolMap.keys()].join(", ")}, finish.`;
    } else {
      try {
        observation = await tool.run(last.input, { userId: ctx.userId });
      } catch (err) {
        observation = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    observation = observation.slice(0, 3000);

    const trace = state.trace.map((t, i) => (i === state.trace.length - 1 ? { ...t, observation } : t));
    await ctx.report?.({ text: "", trace });
    return { trace };
  };

  const route = (state: typeof AgentState.State): "act" | typeof END =>
    state.finalAnswer !== null ? END : "act";

  return new StateGraph(AgentState)
    .addNode("think", think)
    .addNode("act", act)
    .addEdge(START, "think")
    .addConditionalEdges("think", route, ["act", END])
    .addEdge("act", "think")
    .compile();
}