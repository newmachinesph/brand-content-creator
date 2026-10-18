import { eq, and, desc } from "drizzle-orm";
import { cosineDistance, sql } from "drizzle-orm";
import { brandMemories } from "../../../db/schema";
import { getDb } from "./connection";
import type { BrandMemory } from "@/types/memory";

export async function fetchMemoriesByBrand(
  brandId: string
): Promise<BrandMemory[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(brandMemories)
    .where(
      and(eq(brandMemories.brandId, brandId), eq(brandMemories.isActive, true))
    )
    .orderBy(desc(brandMemories.updatedAt));

  return rows.map(mapRow);
}

export async function searchMemories(
  brandId: string,
  embedding: number[],
  limit = 5,
  minSimilarity = 0.3
): Promise<(BrandMemory & { similarity: number })[]> {
  const db = getDb();
  const similarity = sql<number>`1 - (${cosineDistance(brandMemories.embedding, embedding)})`;

  const rows = await db
    .select({
      id: brandMemories.id,
      brandId: brandMemories.brandId,
      type: brandMemories.type,
      source: brandMemories.source,
      title: brandMemories.title,
      content: brandMemories.content,
      tags: brandMemories.tags,
      importance: brandMemories.importance,
      embedding: brandMemories.embedding,
      data: brandMemories.data,
      isActive: brandMemories.isActive,
      createdAt: brandMemories.createdAt,
      updatedAt: brandMemories.updatedAt,
      similarity,
    })
    .from(brandMemories)
    .where(
      and(eq(brandMemories.brandId, brandId), eq(brandMemories.isActive, true))
    )
    .orderBy(sql`${similarity} DESC`)
    .limit(limit);

  return rows
    .filter((r) => (r.similarity ?? 0) >= minSimilarity)
    .map((r) => ({
      ...mapRow(r),
      similarity: r.similarity ?? 0,
    }));
}

export async function saveMemory(memory: BrandMemory): Promise<void> {
  const db = getDb();
  await db
    .insert(brandMemories)
    .values({
      id: memory.id,
      brandId: memory.brandId,
      type: memory.type,
      source: memory.source,
      title: memory.title,
      content: memory.content,
      tags: memory.tags,
      importance: memory.importance,
      embedding: memory.embedding ?? null,
      data: memory.data,
      isActive: memory.isActive,
      createdAt: new Date(memory.createdAt),
      updatedAt: new Date(memory.updatedAt),
    })
    .onConflictDoUpdate({
      target: brandMemories.id,
      set: {
        type: memory.type,
        source: memory.source,
        title: memory.title,
        content: memory.content,
        tags: memory.tags,
        importance: memory.importance,
        embedding: memory.embedding ?? null,
        data: memory.data,
        isActive: memory.isActive,
        updatedAt: new Date(memory.updatedAt),
      },
    });
}

export async function deleteMemoryDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(brandMemories).where(eq(brandMemories.id, id));
}

export async function deactivateMemory(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(brandMemories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(brandMemories.id, id));
}

// ─── Row mapper ──────────────────────────────────────────────────

function mapRow(r: {
  id: string;
  brandId: string;
  type: string;
  source: string;
  title: string;
  content: string;
  tags: unknown;
  importance: number;
  embedding: unknown;
  data: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BrandMemory {
  return {
    id: r.id,
    brandId: r.brandId,
    type: r.type as BrandMemory["type"],
    source: r.source as BrandMemory["source"],
    title: r.title,
    content: r.content,
    tags: (r.tags ?? []) as string[],
    importance: r.importance,
    embedding: (r.embedding ?? undefined) as number[] | undefined,
    data: (r.data ?? {}) as Record<string, unknown>,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
