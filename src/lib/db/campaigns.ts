import { eq } from "drizzle-orm";
import { campaigns } from "../../../db/schema";
import { getDb } from "./connection";
import type { Campaign } from "@/types/campaign";

export async function fetchCampaignsByBrand(
  brandId: string
): Promise<Campaign[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.brandId, brandId))
    .orderBy(campaigns.createdAt);

  return rows.map((r) => ({
    id: r.id,
    brandId: r.brandId,
    name: r.name,
    description: r.description,
    status: r.status as Campaign["status"],
    objective: r.objective,
    startDate: r.startDate,
    endDate: r.endDate,
    platforms: (r.platforms ?? []) as Campaign["platforms"],
    contentPillars: (r.contentPillars ?? []) as Campaign["contentPillars"],
    data: (r.data ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  const db = getDb();
  await db
    .insert(campaigns)
    .values({
      id: campaign.id,
      brandId: campaign.brandId,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      objective: campaign.objective,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      platforms: campaign.platforms,
      contentPillars: campaign.contentPillars,
      data: campaign.data,
      createdAt: new Date(campaign.createdAt),
      updatedAt: new Date(campaign.updatedAt),
    })
    .onConflictDoUpdate({
      target: campaigns.id,
      set: {
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        platforms: campaign.platforms,
        contentPillars: campaign.contentPillars,
        data: campaign.data,
        updatedAt: new Date(campaign.updatedAt),
      },
    });
}

export async function deleteCampaignDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(campaigns).where(eq(campaigns.id, id));
}
