import { eq } from "drizzle-orm";
import { frames } from "../../../db/schema";
import { getDb } from "./connection";
import type { Frame } from "@/types/storyboard";

export async function fetchFramesByStoryboard(
  storyboardId: string
): Promise<Frame[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(frames)
    .where(eq(frames.storyboardId, storyboardId))
    .orderBy(frames.sortOrder);

  return rows.map((r) => ({
    id: r.id,
    storyboardId: r.storyboardId,
    brandId: r.brandId,
    campaignId: r.campaignId ?? undefined,
    title: r.title,
    contentType: r.contentType as Frame["contentType"],
    platform: (r.platform as Frame["platform"]) ?? undefined,
    status: r.status as Frame["status"],
    scheduledDate: r.scheduledDate?.toISOString(),
    publishedDate: r.publishedDate?.toISOString(),
    sortOrder: r.sortOrder,
    data: (r.data ?? {}) as Frame["data"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveFrame(frame: Frame): Promise<void> {
  const db = getDb();
  await db
    .insert(frames)
    .values({
      id: frame.id,
      storyboardId: frame.storyboardId,
      brandId: frame.brandId,
      campaignId: frame.campaignId ?? null,
      title: frame.title,
      contentType: frame.contentType,
      platform: frame.platform ?? null,
      status: frame.status,
      scheduledDate: frame.scheduledDate
        ? new Date(frame.scheduledDate)
        : null,
      publishedDate: frame.publishedDate
        ? new Date(frame.publishedDate)
        : null,
      sortOrder: frame.sortOrder,
      data: frame.data,
      createdAt: new Date(frame.createdAt),
      updatedAt: new Date(frame.updatedAt),
    })
    .onConflictDoUpdate({
      target: frames.id,
      set: {
        title: frame.title,
        contentType: frame.contentType,
        platform: frame.platform ?? null,
        status: frame.status,
        scheduledDate: frame.scheduledDate
          ? new Date(frame.scheduledDate)
          : null,
        publishedDate: frame.publishedDate
          ? new Date(frame.publishedDate)
          : null,
        sortOrder: frame.sortOrder,
        data: frame.data,
        updatedAt: new Date(frame.updatedAt),
      },
    });
}

export async function deleteFrameDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(frames).where(eq(frames.id, id));
}
