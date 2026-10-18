import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  BrandKit,
  BrandListItem,
  BrandSection,
  SectionId,
} from "@/types/brand";
import { createDefaultBrandKit } from "@/lib/brand-defaults";
import {
  fetchAllBrands,
  saveBrand,
  deleteBrand as deleteBrandDb,
} from "@/lib/db";
import { syncVaultToMemories } from "@/lib/vault-memory-sync";
import { useMemoryStore } from "@/stores/memory-store";

// Migrate: strip stale brandKits from old localStorage cache (v0 → v1)
try {
  const raw = localStorage.getItem("brand-kit-storage");
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.state?.brandKits) {
      delete parsed.state.brandKits;
      parsed.version = 1;
      localStorage.setItem("brand-kit-storage", JSON.stringify(parsed));
    }
  }
} catch { /* ignore */ }

interface BrandState {
  brandKits: BrandKit[];
  activeBrandId: string | null;
  activeSectionId: SectionId | null;
  dbLoaded: boolean;

  // Computed-like helper
  getActiveBrand: () => BrandKit | undefined;

  // DB sync
  loadFromDb: () => Promise<void>;

  // Brand-level actions
  createBrandKit: (name: string, description?: string) => void;
  setActiveBrand: (id: string) => void;
  deleteBrandKit: (id: string) => void;
  updateBrandMeta: (name: string, description: string) => void;
  importFromJson: (data: BrandKit) => void;
  exportToJson: () => BrandKit | null;

  // Section-level actions
  setActiveSection: (id: SectionId) => void;
  updateDocumentContent: (sectionId: SectionId, content: string) => void;
  addListItem: (
    sectionId: SectionId,
    item: Pick<BrandListItem, "title" | "content" | "metadata">
  ) => void;
  updateListItem: (
    sectionId: SectionId,
    itemId: string,
    updates: Partial<Pick<BrandListItem, "title" | "content" | "metadata">>
  ) => void;
  removeListItem: (sectionId: SectionId, itemId: string) => void;
  addSection: (kind: "document" | "list", label: string, icon: string) => void;
  removeSection: (sectionId: SectionId) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  replaceAllSections: (data: {
    documents: Record<string, string>;
    lists: Record<
      string,
      Array<{ title: string; content: string; metadata?: Record<string, string> }>
    >;
  }) => void;
  clearAllSections: () => void;
  saveReferenceUrls: (urls: string[]) => void;
}

function findBrand(state: BrandState): BrandKit | undefined {
  return state.brandKits.find((b) => b.id === state.activeBrandId);
}

// Fire-and-forget DB save for the active brand
function syncActiveBrand(get: () => BrandState) {
  const brand = get().getActiveBrand();
  if (brand) {
    saveBrand(brand).catch(console.error);
    scheduleVaultSync(brand.id, brand.sections);
  }
}

// Debounced vault → memory sync (3s delay to batch rapid edits)
let vaultSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleVaultSync(brandId: string, sections: BrandSection[]) {
  if (vaultSyncTimer) clearTimeout(vaultSyncTimer);
  vaultSyncTimer = setTimeout(() => {
    syncVaultToMemories(brandId, sections)
      .then(() => useMemoryStore.getState().refreshMemories(brandId))
      .catch((err) =>
        console.error("Vault → memory sync failed:", err)
      );
  }, 3000);
}

export const useBrandStore = create<BrandState>()(
  persist(
    immer((set, get) => ({
      brandKits: [],
      activeBrandId: null,
      activeSectionId: null,
      dbLoaded: false,

      getActiveBrand: () => {
        const s = get();
        return s.brandKits.find((b) => b.id === s.activeBrandId);
      },

      loadFromDb: async () => {
        try {
          const brands = await fetchAllBrands();
          if (brands.length > 0) {
            set((state) => {
              state.brandKits = brands;
              state.dbLoaded = true;
              // Keep current selection if valid, otherwise pick first
              if (!brands.find((b) => b.id === state.activeBrandId)) {
                state.activeBrandId = brands[0].id;
                state.activeSectionId =
                  brands[0].sections[0]?.id ?? null;
              }
            });
          } else {
            set((state) => {
              state.activeBrandId = null;
              state.activeSectionId = null;
              state.dbLoaded = true;
            });
          }
        } catch (err) {
          console.error("Failed to load brands from DB:", err);
          set((state) => {
            state.dbLoaded = true;
          });
        }
      },

      createBrandKit: (name, description = "") => {
        const kit = createDefaultBrandKit(name, description);
        set((state) => {
          state.brandKits.push(kit);
          state.activeBrandId = kit.id;
          state.activeSectionId = kit.sections[0]?.id ?? null;
        });
        saveBrand(kit).catch(console.error);
      },

      setActiveBrand: (id) => {
        set((state) => {
          const brand = state.brandKits.find((b) => b.id === id);
          state.activeBrandId = id;
          state.activeSectionId = brand?.sections[0]?.id ?? null;
        });
      },

      deleteBrandKit: (id) => {
        set((state) => {
          state.brandKits = state.brandKits.filter((b) => b.id !== id);
          if (state.activeBrandId === id) {
            state.activeBrandId = state.brandKits[0]?.id ?? null;
            const next = state.brandKits.find(
              (b) => b.id === state.activeBrandId
            );
            state.activeSectionId = next?.sections[0]?.id ?? null;
          }
        });
        deleteBrandDb(id).catch(console.error);
      },

      setActiveSection: (id) => {
        set((state) => {
          state.activeSectionId = id;
        });
      },

      updateBrandMeta: (name, description) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          brand.name = name;
          brand.description = description;
          brand.updatedAt = new Date().toISOString();
        });
        syncActiveBrand(get);
      },

      updateDocumentContent: (sectionId, content) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const section = brand.sections.find((s) => s.id === sectionId);
          if (section && section.kind === "document") {
            section.content = content;
            section.updatedAt = new Date().toISOString();
            brand.updatedAt = new Date().toISOString();
          }
        });
        syncActiveBrand(get);
      },

      addListItem: (sectionId, item) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const section = brand.sections.find((s) => s.id === sectionId);
          if (section && section.kind === "list") {
            const now = new Date().toISOString();
            section.items.push({
              id: nanoid(),
              title: item.title,
              content: item.content,
              metadata: item.metadata,
              createdAt: now,
              updatedAt: now,
            });
            section.updatedAt = now;
            brand.updatedAt = now;
          }
        });
        syncActiveBrand(get);
      },

      updateListItem: (sectionId, itemId, updates) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const section = brand.sections.find((s) => s.id === sectionId);
          if (section && section.kind === "list") {
            const item = section.items.find((i) => i.id === itemId);
            if (item) {
              if (updates.title !== undefined) item.title = updates.title;
              if (updates.content !== undefined) item.content = updates.content;
              if (updates.metadata !== undefined)
                item.metadata = updates.metadata;
              const now = new Date().toISOString();
              item.updatedAt = now;
              section.updatedAt = now;
              brand.updatedAt = now;
            }
          }
        });
        syncActiveBrand(get);
      },

      removeListItem: (sectionId, itemId) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const section = brand.sections.find((s) => s.id === sectionId);
          if (section && section.kind === "list") {
            section.items = section.items.filter((i) => i.id !== itemId);
            const now = new Date().toISOString();
            section.updatedAt = now;
            brand.updatedAt = now;
          }
        });
        syncActiveBrand(get);
      },

      addSection: (kind, label, icon) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const now = new Date().toISOString();
          const id = label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          const base = { id, label, icon, updatedAt: now };
          const section: BrandSection =
            kind === "document"
              ? { ...base, kind: "document", content: "" }
              : { ...base, kind: "list", items: [] };
          brand.sections.push(section);
          brand.updatedAt = now;
          state.activeSectionId = id;
        });
        syncActiveBrand(get);
      },

      removeSection: (sectionId) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          brand.sections = brand.sections.filter((s) => s.id !== sectionId);
          brand.updatedAt = new Date().toISOString();
          if (state.activeSectionId === sectionId) {
            state.activeSectionId = brand.sections[0]?.id ?? null;
          }
        });
        syncActiveBrand(get);
      },

      moveSectionUp: (sectionId) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const idx = brand.sections.findIndex((s) => s.id === sectionId);
          if (idx <= 0) return;
          const temp = brand.sections[idx];
          brand.sections[idx] = brand.sections[idx - 1];
          brand.sections[idx - 1] = temp;
          brand.updatedAt = new Date().toISOString();
        });
        syncActiveBrand(get);
      },

      moveSectionDown: (sectionId) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const idx = brand.sections.findIndex((s) => s.id === sectionId);
          if (idx < 0 || idx >= brand.sections.length - 1) return;
          const temp = brand.sections[idx];
          brand.sections[idx] = brand.sections[idx + 1];
          brand.sections[idx + 1] = temp;
          brand.updatedAt = new Date().toISOString();
        });
        syncActiveBrand(get);
      },

      replaceAllSections: (data) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const now = new Date().toISOString();
          for (const section of brand.sections) {
            if (section.kind === "document" && data.documents[section.id]) {
              section.content = data.documents[section.id];
              section.updatedAt = now;
            }
            if (section.kind === "list" && data.lists[section.id]) {
              section.items = data.lists[section.id].map((item) => ({
                id: nanoid(),
                title: item.title,
                content: item.content,
                metadata: item.metadata,
                createdAt: now,
                updatedAt: now,
              }));
              section.updatedAt = now;
            }
          }
          brand.updatedAt = now;
        });
        syncActiveBrand(get);
      },

      clearAllSections: () => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          const now = new Date().toISOString();
          for (const section of brand.sections) {
            if (section.kind === "document") {
              section.content = "";
            } else if (section.kind === "list") {
              section.items = [];
            }
            section.updatedAt = now;
          }
          brand.updatedAt = now;
        });
        syncActiveBrand(get);
      },

      saveReferenceUrls: (urls) => {
        set((state) => {
          const brand = findBrand(state);
          if (!brand) return;
          brand.referenceUrls = urls;
        });
        syncActiveBrand(get);
      },

      exportToJson: () => {
        return get().getActiveBrand() ?? null;
      },

      importFromJson: (data) => {
        set((state) => {
          const idx = state.brandKits.findIndex((b) => b.id === data.id);
          if (idx >= 0) {
            state.brandKits[idx] = data;
          } else {
            state.brandKits.push(data);
          }
          state.activeBrandId = data.id;
          state.activeSectionId = data.sections[0]?.id ?? null;
        });
        saveBrand(data).catch(console.error);
      },
    })),
    {
      name: "brand-kit-storage",
      version: 1,
      partialize: (state) => ({
        activeBrandId: state.activeBrandId,
        activeSectionId: state.activeSectionId,
      }),
    }
  )
);
