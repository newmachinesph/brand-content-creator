import { eq } from "drizzle-orm";
import { designs } from "../../../db/schema";
import { getDb } from "./connection";
import type { Design } from "@/types/design";

export async function fetchDesignsByBrand(brandId: string): Promise<Design[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(designs)
    .where(eq(designs.brandId, brandId))
    .orderBy(designs.createdAt);

  return rows.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    frameId: r.frameId ?? undefined,
    name: r.name,
    canvasJson: (r.canvasJson ?? {}) as object,
    thumbnail: r.thumbnail ?? undefined,
    width: r.width,
    height: r.height,
    platform: (r.platform as Design["platform"]) ?? undefined,
    format: r.format ?? undefined,
    status: (r.status as Design["status"]) ?? "draft",
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveDesign(design: Design): Promise<void> {
  const db = getDb();
  await db
    .insert(designs)
    .values({
      id: design.id,
      brandId: design.brandId,
      frameId: design.frameId ?? null,
      name: design.name,
      canvasJson: design.canvasJson,
      thumbnail: design.thumbnail ?? null,
      width: design.width,
      height: design.height,
      platform: design.platform ?? null,
      format: design.format ?? null,
      status: design.status,
      data: design.data,
      createdAt: new Date(design.createdAt),
      updatedAt: new Date(design.updatedAt),
    })
    .onConflictDoUpdate({
      target: designs.id,
      set: {
        name: design.name,
        canvasJson: design.canvasJson,
        thumbnail: design.thumbnail ?? null,
        status: design.status,
        data: design.data,
        updatedAt: new Date(design.updatedAt),
      },
    });
}

export async function deleteDesignDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(designs).where(eq(designs.id, id));
}
