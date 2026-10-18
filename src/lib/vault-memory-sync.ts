/**
 * Vault → Memory Sync
 *
 * Automatically syncs brand vault sections as high-importance memories
 * with vector embeddings. Each vault section becomes a searchable memory
 * so the AI can query one unified system for all brand knowledge.
 *
 * Vault-synced memories use:
 *   source = "vault_sync"
 *   data.sectionId = the vault section id
 *   importance = 5 (highest)
 *
 * They are read-only in the memory UI — editable only through the vault.
 */

import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { brandMemories } from "../../db/schema";
import { getDb } from "./db/connection";
import { generateEmbeddings } from "./embeddings";
import type { BrandSection } from "@/types/brand";
import type { MemoryType } from "@/types/common";

// ─── Section → Memory type mapping ──────────────────────────────

const SECTION_MEMORY_TYPE: Record<string, MemoryType> = {
  "brand-voice": "preference",
  "messaging-framework": "preference",
  "style-guide": "preference",
  "visual-identity": "preference",
  "target-audiences": "preference",
  "content-examples": "approval",
  "anti-examples": "rejection",
  products: "preference",
};

const SECTION_TAGS: Record<string, string[]> = {
  "brand-voice": ["vault", "voice", "tone"],
  "messaging-framework": ["vault", "messaging"],
  "style-guide": ["vault", "style", "rules"],
  "visual-identity": ["vault", "visual", "design"],
  "target-audiences": ["vault", "audience"],
  "content-examples": ["vault", "examples", "approved"],
  "anti-examples": ["vault", "anti-examples", "avoid"],
  products: ["vault", "products"],
};

// ─── Helpers ────────────────────────────────────────────────────

function sectionToText(section: BrandSection): string {
  if (section.kind === "document") {
    return section.content;
  }
  // List sections: combine all items
  return section.items
    .map((item) => `${item.title}\n${item.content}`)
    .join("\n\n");
}

function sectionHasContent(section: BrandSection): boolean {
  if (section.kind === "document") {
    return section.content.trim().length > 0;
  }
  return section.items.length > 0;
}

// ─── Core sync ──────────────────────────────────────────────────

/**
 * Syncs all vault sections for a brand into the memory system.
 * - Creates new memories for sections that don't have one yet
 * - Updates existing memories when section content changes
 * - Deactivates memories for sections that were emptied
 * - Generates embeddings in batch for efficiency
 */
export async function syncVaultToMemories(
  brandId: string,
  sections: BrandSection[]
): Promise<void> {
  const db = getDb();
  const now = new Date();

  // Fetch existing vault-synced memories for this brand
  const existing = await db
    .select()
    .from(brandMemories)
    .where(
      and(
        eq(brandMemories.brandId, brandId),
        eq(brandMemories.source, "vault_sync")
      )
    );

  // Build a map of sectionId → existing memory
  const existingMap = new Map<string, (typeof existing)[0]>();
  for (const row of existing) {
    const sectionId = (row.data as Record<string, unknown>)?.sectionId;
    if (typeof sectionId === "string") {
      existingMap.set(sectionId, row);
    }
  }

  // Determine what needs creating, updating, or deactivating
  const toUpsert: {
    id: string;
    sectionId: string;
    title: string;
    content: string;
    type: MemoryType;
    tags: string[];
    isNew: boolean;
  }[] = [];

  const toDeactivate: string[] = [];

  for (const section of sections) {
    const hasContent = sectionHasContent(section);
    const existingMemory = existingMap.get(section.id);

    if (hasContent) {
      const content = sectionToText(section);
      const title = section.label;

      // Skip if content hasn't changed
      if (existingMemory && existingMemory.content === content) {
        existingMap.delete(section.id);
        continue;
      }

      toUpsert.push({
        id: existingMemory?.id ?? `vs-${nanoid(8)}`,
        sectionId: section.id,
        title,
        content,
        type: SECTION_MEMORY_TYPE[section.id] ?? "preference",
        tags: SECTION_TAGS[section.id] ?? ["vault"],
        isNew: !existingMemory,
      });
    } else if (existingMemory && existingMemory.isActive) {
      // Section emptied → deactivate memory
      toDeactivate.push(existingMemory.id);
    }

    existingMap.delete(section.id);
  }

  // Deactivate memories for sections that no longer exist
  for (const [, orphan] of existingMap) {
    if (orphan.isActive) {
      toDeactivate.push(orphan.id);
    }
  }

  // Nothing to do
  if (toUpsert.length === 0 && toDeactivate.length === 0) {
    return;
  }

  // Generate embeddings in batch for all upserts
  let embeddings: number[][] = [];
  if (toUpsert.length > 0) {
    try {
      const texts = toUpsert.map((m) => `${m.title}\n${m.content}`);
      embeddings = await generateEmbeddings(texts);
    } catch (err) {
      console.error("Vault sync: embedding generation failed:", err);
      // Continue without embeddings — they can be retried later
      embeddings = toUpsert.map(() => []);
    }
  }

  // Upsert memories
  for (let i = 0; i < toUpsert.length; i++) {
    const m = toUpsert[i];
    const embedding = embeddings[i]?.length > 0 ? embeddings[i] : null;

    await db
      .insert(brandMemories)
      .values({
        id: m.id,
        brandId,
        type: m.type,
        source: "vault_sync",
        title: m.title,
        content: m.content,
        tags: m.tags,
        importance: 5,
        embedding,
        data: { sectionId: m.sectionId },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: brandMemories.id,
        set: {
          title: m.title,
          content: m.content,
          type: m.type,
          tags: m.tags,
          embedding,
          data: { sectionId: m.sectionId },
          isActive: true,
          updatedAt: now,
        },
      });
  }

  // Deactivate removed/emptied sections
  for (const id of toDeactivate) {
    await db
      .update(brandMemories)
      .set({ isActive: false, updatedAt: now })
      .where(eq(brandMemories.id, id));
  }
}

/**
 * Sync a single vault section (called on autosave for efficiency).
 * Only generates one embedding instead of batch.
 */
export async function syncSingleSection(
  brandId: string,
  section: BrandSection
): Promise<void> {
  return syncVaultToMemories(brandId, [section]);
}
