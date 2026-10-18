import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { brandKits, storyboards } from "../../db/schema";
import type { BrandKit } from "@/types/brand";
import type { Storyboard } from "@/types/storyboard";

// Neon serverless driver works over HTTP — safe in webview contexts
const DATABASE_URL = import.meta.env.VITE_DATABASE_URL as string;

function getDb() {
  if (!DATABASE_URL) {
    throw new Error("VITE_DATABASE_URL is not set");
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql);
}

export async function fetchAllBrands(): Promise<BrandKit[]> {
  const db = getDb();
  const rows = await db
    .select({ data: brandKits.data })
    .from(brandKits)
    .orderBy(brandKits.createdAt);
  return rows.map((r) => r.data as BrandKit);
}

export async function saveBrand(brand: BrandKit): Promise<void> {
  const db = getDb();
  await db
    .insert(brandKits)
    .values({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      data: brand,
      createdAt: new Date(brand.createdAt),
      updatedAt: new Date(brand.updatedAt),
    })
    .onConflictDoUpdate({
      target: brandKits.id,
      set: {
        name: brand.name,
        description: brand.description,
        data: brand,
        updatedAt: new Date(brand.updatedAt),
      },
    });
}

export async function deleteBrand(id: string): Promise<void> {
  const db = getDb();
  await db.delete(brandKits).where(eq(brandKits.id, id));
}

// ── Storyboard operations ──────────────────────────────────

export async function fetchStoryboardsByBrand(
  brandId: string
): Promise<Storyboard[]> {
  const db = getDb();
  const rows = await db
    .select({ data: storyboards.data })
    .from(storyboards)
    .where(eq(storyboards.brandId, brandId))
    .orderBy(storyboards.createdAt);
  return rows.map((r) => r.data as Storyboard);
}

export async function saveStoryboard(sb: Storyboard): Promise<void> {
  const db = getDb();
  await db
    .insert(storyboards)
    .values({
      id: sb.id,
      brandId: sb.brandId,
      name: sb.name,
      description: sb.description,
      data: sb,
      createdAt: new Date(sb.createdAt),
      updatedAt: new Date(sb.updatedAt),
    })
    .onConflictDoUpdate({
      target: storyboards.id,
      set: {
        name: sb.name,
        description: sb.description,
        data: sb,
        updatedAt: new Date(sb.updatedAt),
      },
    });
}

export async function deleteStoryboard(id: string): Promise<void> {
  const db = getDb();
  await db.delete(storyboards).where(eq(storyboards.id, id));
}
