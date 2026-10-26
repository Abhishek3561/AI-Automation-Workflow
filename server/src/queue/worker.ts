import { Worker } from "bullmq";
import { redisConnection } from "./connection";
import { RUN_QUEUE } from "./runQueue";
import { executeRun } from "../engine/runner";
import { createRun } from "../engine/createRun";

export const runWorker = new Worker(
  RUN_QUEUE,
  async (job) => {
    const data = job.data as { runId?: string; workflowId?: string; userId?: string };

    // a run that already exists (manual, webhook, or resumed after approval)
    if (data.runId) {
      await executeRun(data.runId);
      return;
    }

    // a scheduled tick: create the run first, then execute it
    if (data.workflowId && data.userId) {
      const runId = await createRun(data.workflowId, data.userId, null);
      await executeRun(runId);
    }
  },
  { connection: redisConnection, concurrency: 3 }
);

runWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Run worker started");