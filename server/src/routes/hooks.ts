import { Router } from "express";
import { prisma } from "../db/prisma";
import { runQueue } from "../queue/runQueue";
import { createRun } from "../engine/createRun";
import type { GraphNode } from "../engine/runner";

const router = Router();

function toPayload(body: unknown): string {
  if (body === undefined || body === null || body === "") return "";
  if (typeof body === "string") return body.slice(0, 20000);
  return JSON.stringify(body, null, 2).slice(0, 20000);
}

// public endpoint: anyone with the secret URL can start this workflow
router.post("/:token", async (req, res) => {
  const workflow = await prisma.workflow.findUnique({ where: { webhookToken: req.params.token } });
  if (!workflow) {
    res.status(404).json({ error: "Unknown webhook" });
    return;
  }

  const graph = workflow.graph as unknown as { nodes?: GraphNode[] };
  const trigger = graph.nodes?.find((n) => n.data.kind === "trigger");
  if (trigger?.data.config?.triggerType !== "webhook") {
    res.status(403).json({ error: "Webhook is not enabled for this workflow" });
    return;
  }

  // simple protection: at most 10 runs per minute per workflow
  const recent = await prisma.run.count({
    where: { workflowId: workflow.id, startedAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= 10) {
    res.status(429).json({ error: "Too many requests. Try again in a minute." });
    return;
  }

  try {
    const runId = await createRun(workflow.id, workflow.userId, toPayload(req.body));
    await runQueue.add("run", { runId }, { removeOnComplete: 100, removeOnFail: 100 });
    res.status(202).json({ runId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Could not start the run" });
  }
});

export default router;