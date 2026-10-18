import { eq, or, isNull } from "drizzle-orm";
import { templates } from "../../../db/schema";
import { getDb } from "./connection";
import type { Template } from "@/types/template";

export async function fetchTemplatesByBrand(
  brandId: string
): Promise<Template[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(templates)
    .where(or(eq(templates.brandId, brandId), isNull(templates.brandId)))
    .orderBy(templates.createdAt);

  return rows.map((r) => {
    const data = (r.data ?? {}) as Record<string, unknown>;
    // Platforms stored in data.platforms; fall back to legacy single platform column
    const platforms = Array.isArray(data.platforms)
      ? (data.platforms as Template["platforms"])
      : r.platform
        ? [r.platform as NonNullable<Template["platforms"]>[number]]
        : undefined;
    return {
      id: r.id,
      brandId: r.brandId ?? undefined,
      name: r.name,
      category: r.category,
      platforms: platforms?.length ? platforms : undefined,
      format: r.format ?? undefined,
      data,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function saveTemplate(template: Template): Promise<void> {
  const db = getDb();
  const dataWithPlatforms = {
    ...template.data,
    platforms: template.platforms ?? [],
  };
  await db
    .insert(templates)
    .values({
      id: template.id,
      brandId: template.brandId ?? null,
      name: template.name,
      category: template.category,
      platform: template.platforms?.[0] ?? null,
      format: template.format ?? null,
      data: dataWithPlatforms,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt),
    })
    .onConflictDoUpdate({
      target: templates.id,
      set: {
        name: template.name,
        category: template.category,
        platform: template.platforms?.[0] ?? null,
        data: dataWithPlatforms,
        updatedAt: new Date(template.updatedAt),
      },
    });
}

export async function deleteTemplateDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(templates).where(eq(templates.id, id));
}
