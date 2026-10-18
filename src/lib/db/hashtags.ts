import { eq, and } from "drizzle-orm";
import { hashtagSets } from "../../../db/schema";
import { getDb } from "./connection";
import type { HashtagSet } from "@/types/hashtag";

export async function fetchHashtagsByFrame(
  frameId: string
): Promise<HashtagSet[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hashtagSets)
    .where(eq(hashtagSets.frameId, frameId));

  return rows.map(mapRow);
}

export async function fetchBrandHashtagLibrary(
  brandId: string
): Promise<HashtagSet[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hashtagSets)
    .where(
      and(
        eq(hashtagSets.brandId, brandId),
        eq(hashtagSets.isBrandLibrary, true)
      )
    );

  return rows.map(mapRow);
}

export async function saveHashtagSet(set: HashtagSet): Promise<void> {
  const db = getDb();
  await db
    .insert(hashtagSets)
    .values({
      id: set.id,
      brandId: set.brandId,
      frameId: set.frameId ?? null,
      topic: set.topic,
      platform: set.platform ?? null,
      hashtags: set.hashtags,
      isBrandLibrary: set.isBrandLibrary,
      data: set.data,
      createdAt: new Date(set.createdAt),
      updatedAt: new Date(set.updatedAt),
    })
    .onConflictDoUpdate({
      target: hashtagSets.id,
      set: {
        topic: set.topic,
        platform: set.platform ?? null,
        hashtags: set.hashtags,
        isBrandLibrary: set.isBrandLibrary,
        data: set.data,
        updatedAt: new Date(set.updatedAt),
      },
    });
}

export async function deleteHashtagSetDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(hashtagSets).where(eq(hashtagSets.id, id));
}

function mapRow(r: {
  id: string;
  brandId: string;
  frameId: string | null;
  topic: string;
  platform: string | null;
  hashtags: unknown;
  isBrandLibrary: boolean;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}): HashtagSet {
  return {
    id: r.id,
    brandId: r.brandId,
    frameId: r.frameId ?? undefined,
    topic: r.topic,
    platform: (r.platform as HashtagSet["platform"]) ?? undefined,
    hashtags: (r.hashtags ?? []) as HashtagSet["hashtags"],
    isBrandLibrary: r.isBrandLibrary,
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
