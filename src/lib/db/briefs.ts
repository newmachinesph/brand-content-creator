import { eq } from "drizzle-orm";
import { briefs } from "../../../db/schema";
import { getDb } from "./connection";
import type { Brief } from "@/types/brief";

export async function fetchBriefsByFrame(frameId: string): Promise<Brief[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(briefs)
    .where(eq(briefs.frameId, frameId));

  return rows.map((r) => ({
    id: r.id,
    frameId: r.frameId,
    brandId: r.brandId,
    type: r.type as Brief["type"],
    status: r.status as Brief["status"],
    generatedContent: r.generatedContent,
    promptUsed: r.promptUsed,
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveBrief(brief: Brief): Promise<void> {
  const db = getDb();
  await db
    .insert(briefs)
    .values({
      id: brief.id,
      frameId: brief.frameId,
      brandId: brief.brandId,
      type: brief.type,
      status: brief.status,
      generatedContent: brief.generatedContent,
      promptUsed: brief.promptUsed,
      data: brief.data,
      createdAt: new Date(brief.createdAt),
      updatedAt: new Date(brief.updatedAt),
    })
    .onConflictDoUpdate({
      target: briefs.id,
      set: {
        status: brief.status,
        generatedContent: brief.generatedContent,
        promptUsed: brief.promptUsed,
        data: brief.data,
        updatedAt: new Date(brief.updatedAt),
      },
    });
}

export async function deleteBriefDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(briefs).where(eq(briefs.id, id));
}
