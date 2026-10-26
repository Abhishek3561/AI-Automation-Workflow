import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/auth";
import { runQueue } from "../queue/runQueue";
import { createRun } from "../engine/createRun";
import { param } from "../utils/params";

const router = Router();

const jobOpts = { removeOnComplete: 100, removeOnFail: 100 };

// start a run
router.post("/workflows/:id/run", requireAuth, async (req, res) => {
  try {
    const runId = await createRun(param(req.params.id), req.userId!, null);
    await runQueue.add("run", { runId }, jobOpts);
    res.status(201).json({ runId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the run";
    res.status(message === "Workflow not found" ? 404 : 400).json({ error: message });
  }
});

// get one run with its steps
router.get("/runs/:id", requireAuth, async (req, res) => {
  const run = await prisma.run.findFirst({
    where: { id: param(req.params.id), userId: req.userId },
    include: {
      steps: { orderBy: { position: "asc" } },
      workflow: { select: { id: true, name: true } },
    },
  });
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json({ run });
});

// list recent runs of a workflow
router.get("/workflows/:id/runs", requireAuth, async (req, res) => {
  const runs = await prisma.run.findMany({
    where: { workflowId: param(req.params.id), userId: req.userId },
    orderBy: { startedAt: "desc" },
    take: 30,
    select: { id: true, status: true, startedAt: true, finishedAt: true },
  });
  res.json({ runs });
});

// approve (optionally with edited text) or reject a step that is waiting for a person
const decisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  text: z.string().max(20000).optional(),
});

router.post("/runs/:id/steps/:stepId/decision", requireAuth, async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid decision" });
    return;
  }
  const { decision, text } = parsed.data;
  const runId = param(req.params.id);
  const stepId = param(req.params.stepId);

  const step = await prisma.runStep.findFirst({
    where: { id: stepId, runId, run: { userId: req.userId } },
  });
  if (!step) {
    res.status(404).json({ error: "Step not found" });
    return;
  }
  if (step.status !== "WAITING_APPROVAL") {
    res.status(409).json({ error: "This step is not waiting for approval" });
    return;
  }

  const previous = (step.input as { previous?: string } | null)?.previous ?? "";
  const now = new Date();

  const data: Prisma.RunStepUpdateManyMutationInput =
    decision === "approve"
      ? { status: "COMPLETED", output: { text: text ?? previous, approved: true }, finishedAt: now }
      : { status: "FAILED", error: "Rejected by reviewer", finishedAt: now };

  // claim it atomically so a double click cannot resume the run twice
  const claimed = await prisma.runStep.updateMany({
    where: { id: step.id, status: "WAITING_APPROVAL" },
    data,
  });
  if (claimed.count === 0) {
    res.status(409).json({ error: "Someone already decided this step" });
    return;
  }

  if (decision === "reject") {
    await prisma.run.update({
      where: { id: runId },
      data: { status: "FAILED", finishedAt: now },
    });
    res.json({ ok: true });
    return;
  }

  await prisma.run.update({ where: { id: runId }, data: { status: "PENDING" } });
  await runQueue.add("run", { runId }, jobOpts);
  res.json({ ok: true });
});

export default router;