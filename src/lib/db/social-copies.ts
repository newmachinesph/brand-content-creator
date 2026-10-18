import { eq } from "drizzle-orm";
import { socialCopies } from "../../../db/schema";
import { getDb } from "./connection";
import type { SocialCopy } from "@/types/social-copy";

export async function fetchCopiesByFrame(
  frameId: string
): Promise<SocialCopy[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(socialCopies)
    .where(eq(socialCopies.frameId, frameId))
    .orderBy(socialCopies.variationIndex);

  return rows.map((r) => ({
    id: r.id,
    frameId: r.frameId,
    brandId: r.brandId,
    platform: r.platform as SocialCopy["platform"],
    variationIndex: r.variationIndex,
    caption: r.caption,
    hashtags: r.hashtags,
    cta: r.cta,
    characterCount: r.characterCount,
    status: r.status as SocialCopy["status"],
    promptUsed: r.promptUsed,
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveSocialCopy(copy: SocialCopy): Promise<void> {
  const db = getDb();
  await db
    .insert(socialCopies)
    .values({
      id: copy.id,
      frameId: copy.frameId,
      brandId: copy.brandId,
      platform: copy.platform,
      variationIndex: copy.variationIndex,
      caption: copy.caption,
      hashtags: copy.hashtags,
      cta: copy.cta,
      characterCount: copy.characterCount,
      status: copy.status,
      promptUsed: copy.promptUsed,
      data: copy.data,
      createdAt: new Date(copy.createdAt),
      updatedAt: new Date(copy.updatedAt),
    })
    .onConflictDoUpdate({
      target: socialCopies.id,
      set: {
        caption: copy.caption,
        hashtags: copy.hashtags,
        cta: copy.cta,
        characterCount: copy.characterCount,
        status: copy.status,
        promptUsed: copy.promptUsed,
        data: copy.data,
        updatedAt: new Date(copy.updatedAt),
      },
    });
}

export async function deleteSocialCopyDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(socialCopies).where(eq(socialCopies.id, id));
}
