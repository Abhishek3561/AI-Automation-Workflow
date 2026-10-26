import { prisma } from "../../db/prisma";
import { embedTexts } from "./embeddings";

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function addChunks(documentId: string, userId: string, chunks: string[]) {
  const vectors = await embedTexts(chunks);
  await prisma.$transaction(
    chunks.map(
      (content, i) => prisma.$executeRaw`
        INSERT INTO document_chunks (id, "documentId", "userId", "chunkIndex", content, embedding)
        VALUES (gen_random_uuid()::text, ${documentId}, ${userId}, ${i}, ${content}, ${toVector(vectors[i])}::vector)`
    )
  );
}

export type Hit = { content: string; filename: string; chunkIndex: number; score: number };

export async function searchChunks(userId: string, query: string, topK: number): Promise<Hit[]> {
  const [queryVector] = await embedTexts([query]);
  const vec = toVector(queryVector);

  const rows = await prisma.$queryRaw<Hit[]>`
    SELECT c.content, d.filename, c."chunkIndex",
           1 - (c.embedding <=> ${vec}::vector) AS score
    FROM document_chunks c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c."userId" = ${userId}
    ORDER BY c.embedding <=> ${vec}::vector
    LIMIT ${topK}`;

  return rows.map((r) => ({ ...r, score: Number(r.score) }));
}