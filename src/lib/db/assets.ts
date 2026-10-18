import { eq } from "drizzle-orm";
import { assets } from "../../../db/schema";
import { getDb } from "./connection";
import type { Asset } from "@/types/asset";

export async function fetchAssetsByBrand(brandId: string): Promise<Asset[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(assets)
    .where(eq(assets.brandId, brandId))
    .orderBy(assets.createdAt);

  return rows.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    frameId: r.frameId ?? undefined,
    fileName: r.fileName,
    fileUrl: r.fileUrl,
    fileType: r.fileType,
    fileSize: r.fileSize,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    duration: r.duration ?? undefined,
    version: r.version,
    parentAssetId: r.parentAssetId ?? undefined,
    tags: (r.tags ?? []) as string[],
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveAsset(asset: Asset): Promise<void> {
  const db = getDb();
  await db
    .insert(assets)
    .values({
      id: asset.id,
      brandId: asset.brandId,
      frameId: asset.frameId ?? null,
      fileName: asset.fileName,
      fileUrl: asset.fileUrl,
      fileType: asset.fileType,
      fileSize: asset.fileSize,
      width: asset.width ?? null,
      height: asset.height ?? null,
      duration: asset.duration ?? null,
      version: asset.version,
      parentAssetId: asset.parentAssetId ?? null,
      tags: asset.tags,
      data: asset.data,
      createdAt: new Date(asset.createdAt),
      updatedAt: new Date(asset.updatedAt),
    })
    .onConflictDoUpdate({
      target: assets.id,
      set: {
        frameId: asset.frameId ?? null,
        fileName: asset.fileName,
        fileUrl: asset.fileUrl,
        tags: asset.tags,
        data: asset.data,
        updatedAt: new Date(asset.updatedAt),
      },
    });
}

export async function deleteAssetDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(assets).where(eq(assets.id, id));
}
