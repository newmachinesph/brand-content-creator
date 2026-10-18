import { eq } from "drizzle-orm";
import { promptTemplates } from "../../../db/schema";
import { getDb } from "./connection";
import type { PromptTemplate, PromptTemplateKey } from "@/types/prompt-template";

export async function fetchPromptTemplatesByBrand(
  brandId: string
): Promise<PromptTemplate[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.brandId, brandId))
    .orderBy(promptTemplates.key);

  return rows.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    key: r.key as PromptTemplateKey,
    name: r.name,
    template: r.template,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function savePromptTemplate(
  template: PromptTemplate
): Promise<void> {
  const db = getDb();
  await db
    .insert(promptTemplates)
    .values({
      id: template.id,
      brandId: template.brandId,
      key: template.key,
      name: template.name,
      template: template.template,
      isDefault: template.isDefault,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt),
    })
    .onConflictDoUpdate({
      target: promptTemplates.id,
      set: {
        name: template.name,
        template: template.template,
        isDefault: template.isDefault,
        updatedAt: new Date(template.updatedAt),
      },
    });
}

export async function deletePromptTemplateDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
}
