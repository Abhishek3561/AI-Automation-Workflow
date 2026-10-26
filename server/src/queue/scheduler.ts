import { runQueue } from "./runQueue";
import type { GraphNode } from "../engine/runner";

const schedulerId = (workflowId: string) => `wf-schedule:${workflowId}`;

// keeps the repeating job in sync with the Start node's settings
export async function syncSchedule(workflow: { id: string; userId: string; graph: unknown }) {
  const graph = workflow.graph as { nodes?: GraphNode[] };
  const trigger = graph.nodes?.find((n) => n.data.kind === "trigger");
  const config = trigger?.data.config ?? {};

  if (config.triggerType !== "schedule") {
    await runQueue.removeJobScheduler(schedulerId(workflow.id));
    return;
  }

  const cron = (config.cron ?? "").trim();
  if (!cron) throw new Error("Add a cron expression, for example 0 9 * * *");

  await runQueue.upsertJobScheduler(
    schedulerId(workflow.id),
    { pattern: cron, tz: (config.timezone || "UTC").trim() },
    {
      name: "scheduled-run",
      data: { workflowId: workflow.id, userId: workflow.userId },
      opts: { removeOnComplete: 50, removeOnFail: 50 },
    }
  );
}

export async function removeSchedule(workflowId: string) {
  await runQueue.removeJobScheduler(schedulerId(workflowId));
}