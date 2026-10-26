import { prisma } from "../db/prisma";
import { orderNodes, type GraphNode, type GraphEdge } from "./runner";

export async function createRun(
  workflowId: string,
  userId: string,
  triggerPayload: string | null
): Promise<string> {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!workflow) throw new Error("Workflow not found");

  const graph = workflow.graph as unknown as { nodes?: GraphNode[]; edges?: GraphEdge[] };
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  if (nodes.length === 0) throw new Error("Add at least one node before running");

  const ordered = orderNodes(nodes, edges);

  const run = await prisma.run.create({
    data: {
      workflowId,
      userId,
      status: "PENDING",
      triggerPayload,
      steps: {
        create: ordered.map((n, i) => ({
          nodeId: n.id,
          nodeType: n.data.kind,
          position: i,
        })),
      },
    },
  });
  return run.id;
}