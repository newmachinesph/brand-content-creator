import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { PromptTemplate, PromptTemplateKey } from "@/types/prompt-template";
import {
  fetchPromptTemplatesByBrand,
  savePromptTemplate,
  deletePromptTemplateDb,
} from "@/lib/db/prompt-templates";

interface PromptTemplateState {
  templates: PromptTemplate[];
  loading: boolean;
  loadedBrandId: string | null;

  loadTemplates: (brandId: string) => Promise<void>;
  upsertTemplate: (
    brandId: string,
    key: PromptTemplateKey,
    name: string,
    template: string
  ) => void;
  deleteTemplate: (id: string) => void;
  resetTemplate: (id: string) => void;

  /** Get the custom template for a given brand + key, or undefined if none */
  getTemplate: (
    brandId: string,
    key: PromptTemplateKey
  ) => PromptTemplate | undefined;
}

export const usePromptTemplateStore = create<PromptTemplateState>()(
  immer((set, get) => ({
    templates: [],
    loading: false,
    loadedBrandId: null,

    loadTemplates: async (brandId) => {
      if (get().loadedBrandId === brandId && get().templates.length > 0) {
        return;
      }
      set((state) => {
        state.loading = true;
      });
      try {
        const rows = await fetchPromptTemplatesByBrand(brandId);
        set((state) => {
          state.templates = rows;
          state.loadedBrandId = brandId;
          state.loading = false;
        });
      } catch (err) {
        console.error("Failed to load prompt templates:", err);
        set((state) => {
          state.loading = false;
        });
      }
    },

    upsertTemplate: (brandId, key, name, template) => {
      const existing = get().templates.find(
        (t) => t.brandId === brandId && t.key === key
      );
      const now = new Date().toISOString();

      if (existing) {
        // Update existing
        set((state) => {
          const t = state.templates.find((t) => t.id === existing.id);
          if (t) {
            t.name = name;
            t.template = template;
            t.updatedAt = now;
          }
        });
        const updated = get().templates.find((t) => t.id === existing.id);
        if (updated) savePromptTemplate(updated).catch(console.error);
      } else {
        // Create new
        const newTemplate: PromptTemplate = {
          id: nanoid(),
          brandId,
          key,
          name,
          template,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.templates.push(newTemplate);
        });
        savePromptTemplate(newTemplate).catch(console.error);
      }
    },

    deleteTemplate: (id) => {
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      });
      deletePromptTemplateDb(id).catch(console.error);
    },

    resetTemplate: (id) => {
      // Delete the custom template so the system falls back to default
      get().deleteTemplate(id);
    },

    getTemplate: (brandId, key) => {
      return get().templates.find(
        (t) => t.brandId === brandId && t.key === key
      );
    },
  }))
);
