import { Router } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/auth";
import { extractText } from "../ai/rag/loader";
import { splitText } from "../ai/rag/splitter";
import { addChunks } from "../ai/rag/vectorStore";
import { param } from "../utils/params";

const router = Router();
const MAX_CHUNKS = 400;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, [".pdf", ".txt", ".md"].includes(ext));
  },
});

// upload, extract, chunk, embed, store
router.post(
  "/",
  requireAuth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Upload a .pdf, .txt or .md file (max 10 MB)" });
      return;
    }

    let docId: string | undefined;
    try {
      const text = await extractText(file.buffer, file.originalname);
      if (text.trim().length < 20) {
        throw new Error("No readable text found in this file (scanned PDFs are not supported yet)");
      }
      const chunks = await splitText(text);
      if (chunks.length > MAX_CHUNKS) {
        throw new Error(`This file is too large (${chunks.length} parts, the limit is ${MAX_CHUNKS})`);
      }

      const doc = await prisma.document.create({
        data: {
          userId: req.userId!,
          filename: file.originalname,
          mimeType: file.mimetype,
          chunkCount: chunks.length,
        },
      });
      docId = doc.id;

      await addChunks(doc.id, req.userId!, chunks);
      res.status(201).json({ document: doc });
    } catch (err) {
      if (docId) await prisma.document.delete({ where: { id: docId } }).catch(() => {});
      res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
    }
  }
);

router.get("/", requireAuth, async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, chunkCount: true, createdAt: true },
  });
  res.json({ documents });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const doc = await prisma.document.findFirst({
        where: { id: param(req.params.id), userId: req.userId },
  });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  await prisma.document.delete({ where: { id: doc.id } });
  res.json({ ok: true });
});

export default router;