import { Annotation } from "@langchain/langgraph";

export type TraceItem = {
  step: number;
  thought: string;
  action: string;
  input: string;
  observation?: string;
};

// what the agent remembers while it works
export const AgentState = Annotation.Root({
  goal: Annotation<string>({ reducer: (_old, next) => next, default: () => "" }),
  trace: Annotation<TraceItem[]>({ reducer: (_old, next) => next, default: () => [] }),
  finalAnswer: Annotation<string | null>({ reducer: (_old, next) => next, default: () => null }),
});