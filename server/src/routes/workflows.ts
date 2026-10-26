import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/auth";
import { syncSchedule, removeSchedule } from "../queue/scheduler";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  graph: z
    .object({
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
    })
    .optional(),
});

// list my workflows
router.get("/", async (req, res) => {
  const workflows = await prisma.workflow.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, description: true, updatedAt: true },
  });
  res.json({ workflows });
});

// create
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const workflow = await prisma.workflow.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json({ workflow });
});

// get one (creates its webhook secret the first time it is opened)
router.get("/:id", async (req, res) => {
  let workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  if (!workflow.webhookToken) {
    workflow = await prisma.workflow.update({
      where: { id: workflow.id },
      data: { webhookToken: randomUUID() },
    });
  }
  res.json({ workflow });
});

// update (name, description, graph)
router.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const existing = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  const workflow = await prisma.workflow.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  try {
    await syncSchedule(workflow);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown error";
    res.status(400).json({ error: `Saved, but the schedule could not be set: ${reason}` });
    return;
  }

  res.json({ workflow });
});

// delete
router.delete("/:id", async (req, res) => {
  const existing = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  await prisma.workflow.delete({ where: { id: req.params.id } });
  await removeSchedule(req.params.id).catch(() => {});
  res.json({ ok: true });
});

export default router;