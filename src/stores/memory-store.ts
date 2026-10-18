import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { BrandMemory, CreateMemoryInput } from "@/types/memory";
import {
  fetchMemoriesByBrand,
  saveMemory,
  deleteMemoryDb,
  deactivateMemory,
  searchMemories,
} from "@/lib/db/memories";
import { generateEmbedding } from "@/lib/embeddings";

interface MemoryState {
  memories: BrandMemory[];
  loadedBrandId: string | null;
  activeMemoryId: string | null;
  searchResults: (BrandMemory & { similarity: number })[];
  isSearching: boolean;

  loadMemories: (brandId: string) => Promise<void>;
  refreshMemories: (brandId: string) => Promise<void>;
  createMemory: (brandId: string, input: CreateMemoryInput) => Promise<void>;
  updateMemory: (id: string, updates: Partial<BrandMemory>) => void;
  deleteMemory: (id: string) => void;
  archiveMemory: (id: string) => void;
  setActiveMemory: (id: string | null) => void;
  getActiveMemory: () => BrandMemory | undefined;
  semanticSearch: (brandId: string, query: string) => Promise<void>;
  clearSearch: () => void;
}

function syncMemory(get: () => MemoryState, id: string) {
  const memory = get().memories.find((m) => m.id === id);
  if (memory) {
    saveMemory(memory).catch(console.error);
  }
}

export const useMemoryStore = create<MemoryState>()(
  immer((set, get) => ({
    memories: [],
    loadedBrandId: null,
    activeMemoryId: null,
    searchResults: [],
    isSearching: false,

    loadMemories: async (brandId) => {
      if (get().loadedBrandId === brandId && get().memories.length > 0) {
        return;
      }
      try {
        const rows = await fetchMemoriesByBrand(brandId);
        set((state) => {
          state.memories = rows;
          state.loadedBrandId = brandId;
          if (
            state.activeMemoryId &&
            !rows.find((m) => m.id === state.activeMemoryId)
          ) {
            state.activeMemoryId = null;
          }
        });
      } catch (err) {
        console.error("Failed to load memories:", err);
      }
    },

    refreshMemories: async (brandId) => {
      try {
        const rows = await fetchMemoriesByBrand(brandId);
        set((state) => {
          state.memories = rows;
          state.loadedBrandId = brandId;
          if (
            state.activeMemoryId &&
            !rows.find((m) => m.id === state.activeMemoryId)
          ) {
            state.activeMemoryId = null;
          }
        });
      } catch (err) {
        console.error("Failed to refresh memories:", err);
      }
    },

    createMemory: async (brandId, input) => {
      const now = new Date().toISOString();
      const memory: BrandMemory = {
        id: nanoid(),
        brandId,
        type: input.type,
        source: input.source ?? "manual",
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
        importance: input.importance ?? 1,
        data: {},
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // Add to store immediately
      set((state) => {
        state.memories.unshift(memory);
        state.activeMemoryId = memory.id;
      });

      // Generate embedding async and save
      try {
        const embedding = await generateEmbedding(
          `${memory.title}\n${memory.content}`
        );
        memory.embedding = embedding;
      } catch (err) {
        console.error("Failed to generate embedding:", err);
      }

      // Update store with embedding
      set((state) => {
        const m = state.memories.find((x) => x.id === memory.id);
        if (m && memory.embedding) {
          m.embedding = memory.embedding;
        }
      });

      saveMemory(memory).catch(console.error);
    },

    updateMemory: (id, updates) => {
      set((state) => {
        const memory = state.memories.find((m) => m.id === id);
        if (!memory) return;
        Object.assign(memory, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      syncMemory(get, id);

      // Re-embed if content changed
      if (updates.title || updates.content) {
        const memory = get().memories.find((m) => m.id === id);
        if (memory) {
          generateEmbedding(`${memory.title}\n${memory.content}`)
            .then((embedding) => {
              set((state) => {
                const m = state.memories.find((x) => x.id === id);
                if (m) m.embedding = embedding;
              });
              syncMemory(get, id);
            })
            .catch(console.error);
        }
      }
    },

    deleteMemory: (id) => {
      set((state) => {
        state.memories = state.memories.filter((m) => m.id !== id);
        if (state.activeMemoryId === id) {
          state.activeMemoryId = null;
        }
      });
      deleteMemoryDb(id).catch(console.error);
    },

    archiveMemory: (id) => {
      set((state) => {
        state.memories = state.memories.filter((m) => m.id !== id);
        if (state.activeMemoryId === id) {
          state.activeMemoryId = null;
        }
      });
      deactivateMemory(id).catch(console.error);
    },

    setActiveMemory: (id) => {
      set((state) => {
        state.activeMemoryId = id;
      });
    },

    getActiveMemory: () => {
      const s = get();
      return s.memories.find((m) => m.id === s.activeMemoryId);
    },

    semanticSearch: async (brandId, query) => {
      set((state) => {
        state.isSearching = true;
      });

      try {
        const embedding = await generateEmbedding(query);
        const results = await searchMemories(brandId, embedding, 10, 0.2);
        set((state) => {
          state.searchResults = results;
          state.isSearching = false;
        });
      } catch (err) {
        console.error("Semantic search failed:", err);
        set((state) => {
          state.isSearching = false;
        });
      }
    },

    clearSearch: () => {
      set((state) => {
        state.searchResults = [];
      });
    },
  }))
);
