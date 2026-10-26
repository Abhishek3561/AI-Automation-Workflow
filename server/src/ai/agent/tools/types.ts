export type ToolCtx = { userId: string };

export type AgentTool = {
  name: string;
  description: string;
  run: (input: string, ctx: ToolCtx) => Promise<string>;
};