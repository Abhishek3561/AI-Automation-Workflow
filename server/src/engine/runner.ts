import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { executors, evaluateCondition } from "./executors";

export type GraphNode = {
  id: string;
  data: { kind: string; config?: Record<string, string> };
};
export type GraphEdge = {
  source: string;
  target: string;
  sourceHandle?: string | null;
};

// put nodes in a valid run order (a node runs after everything feeding into it)
export function orderNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const indegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    if (indegree.has(e.source) && indegree.has(e.target)) {
      indegree.set(e.target, indegree.get(e.target)! + 1);
    }
  }

  const ready = nodes.filter((n) => indegree.get(n.id) === 0);
  const result: GraphNode[] = [];

  while (ready.length) {
    const node = ready.shift()!;
    result.push(node);
    for (const e of edges) {
      if (e.source !== node.id || !indegree.has(e.target)) continue;
      const left = indegree.get(e.target)! - 1;
      indegree.set(e.target, left);
      if (left === 0) ready.push(nodes.find((n) => n.id === e.target)!);
    }
  }

  if (result.length !== nodes.length) {
    throw new Error("Workflow has a loop. Remove the connection that goes back.");
  }
  return result;
}

// runs a workflow. If it reaches a human approval node it saves its place and stops;
// calling executeRun again after the approval continues from that point.
export async function executeRun(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { workflow: true, steps: true },
  });
  if (!run) return;
  if (["COMPLETED", "FAILED", "WAITING_APPROVAL"].includes(run.status)) return;

  await prisma.run.update({ where: { id: runId }, data: { status: "RUNNING" } });

  const graph = run.workflow.graph as unknown as { nodes: GraphNode[]; edges: GraphEdge[] };
  const outputs = new Map<string, string>();
  const executed = new Set<string>();
  const branchTaken = new Map<string, string>(); // if/else node id -> "true" | "false"

  try {
    const ordered = orderNodes(graph.nodes, graph.edges);

    for (const node of ordered) {
      const step = run.steps.find((s) => s.nodeId === node.id);
      if (!step) continue;

      // finished in an earlier pass (this is a resume): restore what it produced
      if (step.status === "COMPLETED") {
        const out = (step.output ?? {}) as { text?: string; branch?: string };
        outputs.set(node.id, out.text ?? "");
        executed.add(node.id);
        if (out.branch) branchTaken.set(node.id, out.branch);
        continue;
      }
      if (step.status === "SKIPPED") continue;

      // an incoming line is "live" if its source ran and (for if/else) took that branch
      const incoming = graph.edges.filter((e) => e.target === node.id);
      const liveEdges = incoming.filter((e) => {
        if (!executed.has(e.source)) return false;
        const taken = branchTaken.get(e.source);
        return taken === undefined || (e.sourceHandle ?? "") === taken;
      });

      if (incoming.length > 0 && liveEdges.length === 0) {
        await prisma.runStep.update({
          where: { id: step.id },
          data: { status: "SKIPPED", finishedAt: new Date() },
        });
        continue;
      }

      const previous = liveEdges
        .map((e) => outputs.get(e.source))
        .filter((v): v is string => v !== undefined)
        .join("\n\n");
      const config = node.data.config ?? {};

      // human approval: save our place and stop until someone decides
      if (node.data.kind === "approval") {
        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: "WAITING_APPROVAL",
            startedAt: new Date(),
            input: { previous, instructions: config.instructions ?? "" },
          },
        });
        await prisma.run.update({ where: { id: runId }, data: { status: "WAITING_APPROVAL" } });
        return;
      }

      await prisma.runStep.update({
        where: { id: step.id },
        data: { status: "RUNNING", startedAt: new Date(), input: { previous } },
      });

      try {
        let output: Record<string, unknown>;

        if (node.data.kind === "condition") {
          const result = evaluateCondition(config, previous);
          const branch = result ? "true" : "false";
          branchTaken.set(node.id, branch);
          output = { text: previous, branch };
        } else {
          const executor = executors[node.data.kind];
          if (!executor) throw new Error(`Unknown node type: ${node.data.kind}`);
          const result = await executor({
            config,
            previous,
            userId: run.userId,
            triggerPayload: run.triggerPayload,
            // lets long-running nodes (the agent) show progress while they work
            report: async (partial) => {
              await prisma.runStep.update({
                where: { id: step.id },
                data: { output: partial as Prisma.InputJsonObject },
              });
            },
          });
          output = typeof result === "string" ? { text: result } : result;
        }

        outputs.set(node.id, String(output.text ?? ""));
        executed.add(node.id);
        await prisma.runStep.update({
          where: { id: step.id },
          data: {
            status: "COMPLETED",
            output: output as Prisma.InputJsonObject,
            finishedAt: new Date(),
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.runStep.update({
          where: { id: step.id },
          data: { status: "FAILED", error: message, finishedAt: new Date() },
        });
        throw err;
      }
    }

    await prisma.run.update({
      where: { id: runId },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
  } catch {
    await prisma.run.update({
      where: { id: runId },
      data: { status: "FAILED", finishedAt: new Date() },
    });
  }
}