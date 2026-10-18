import { eq } from "drizzle-orm";
import { platformSpecs } from "../../../db/schema";
import { getDb } from "./connection";
import type { PlatformSpec } from "@/types/platform-specs";

export async function fetchAllPlatformSpecs(): Promise<PlatformSpec[]> {
  const db = getDb();
  const rows = await db.select().from(platformSpecs).orderBy(platformSpecs.platform);

  return rows.map((r) => ({
    id: r.id,
    platform: r.platform as PlatformSpec["platform"],
    format: r.format,
    name: r.name,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    aspectRatio: r.aspectRatio ?? undefined,
    maxFileSize: r.maxFileSize ?? undefined,
    maxDuration: r.maxDuration ?? undefined,
    captionLimit: r.captionLimit ?? undefined,
    hashtagLimit: r.hashtagLimit ?? undefined,
    supportedFormats: (r.supportedFormats ?? []) as string[],
    rules: (r.rules ?? []) as string[],
    data: (r.data ?? {}) as Record<string, unknown>,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function fetchSpecsByPlatform(
  platform: string
): Promise<PlatformSpec[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(platformSpecs)
    .where(eq(platformSpecs.platform, platform));

  return rows.map((r) => ({
    id: r.id,
    platform: r.platform as PlatformSpec["platform"],
    format: r.format,
    name: r.name,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    aspectRatio: r.aspectRatio ?? undefined,
    maxFileSize: r.maxFileSize ?? undefined,
    maxDuration: r.maxDuration ?? undefined,
    captionLimit: r.captionLimit ?? undefined,
    hashtagLimit: r.hashtagLimit ?? undefined,
    supportedFormats: (r.supportedFormats ?? []) as string[],
    rules: (r.rules ?? []) as string[],
    data: (r.data ?? {}) as Record<string, unknown>,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function savePlatformSpec(spec: PlatformSpec): Promise<void> {
  const db = getDb();
  await db
    .insert(platformSpecs)
    .values({
      id: spec.id,
      platform: spec.platform,
      format: spec.format,
      name: spec.name,
      width: spec.width ?? null,
      height: spec.height ?? null,
      aspectRatio: spec.aspectRatio ?? null,
      maxFileSize: spec.maxFileSize ?? null,
      maxDuration: spec.maxDuration ?? null,
      captionLimit: spec.captionLimit ?? null,
      hashtagLimit: spec.hashtagLimit ?? null,
      supportedFormats: spec.supportedFormats,
      rules: spec.rules,
      data: spec.data,
      updatedAt: new Date(spec.updatedAt),
    })
    .onConflictDoUpdate({
      target: platformSpecs.id,
      set: {
        name: spec.name,
        width: spec.width ?? null,
        height: spec.height ?? null,
        aspectRatio: spec.aspectRatio ?? null,
        maxFileSize: spec.maxFileSize ?? null,
        maxDuration: spec.maxDuration ?? null,
        captionLimit: spec.captionLimit ?? null,
        hashtagLimit: spec.hashtagLimit ?? null,
        supportedFormats: spec.supportedFormats,
        rules: spec.rules,
        data: spec.data,
        updatedAt: new Date(spec.updatedAt),
      },
    });
}
