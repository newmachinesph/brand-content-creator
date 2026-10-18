import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { Template } from "@/types/template";
import type { ContentPlatform } from "@/types/common";
import {
  fetchTemplatesByBrand,
  saveTemplate,
  deleteTemplateDb,
} from "@/lib/db/templates";
import { useBrandStore } from "./brand-store";

interface TemplateState {
  templates: Template[];
  loadedBrandId: string | null;

  loadTemplates: (brandId: string) => Promise<void>;
  addTemplate: (input: {
    name: string;
    category: string;
    platforms?: ContentPlatform[];
    description?: string;
  }) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  removeTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
  immer((set, get) => ({
    templates: [],
    loadedBrandId: null,

    loadTemplates: async (brandId) => {
      if (get().loadedBrandId === brandId && get().templates.length > 0) {
        return;
      }
      try {
        const rows = await fetchTemplatesByBrand(brandId);
        set((state) => {
          state.templates = rows;
          state.loadedBrandId = brandId;
        });
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    },

    addTemplate: (input) => {
      const brandId = useBrandStore.getState().activeBrandId;
      if (!brandId) return;

      const now = new Date().toISOString();
      const template: Template = {
        id: nanoid(),
        brandId,
        name: input.name,
        category: input.category,
        platforms: input.platforms?.length ? input.platforms : undefined,
        data: {
          description: input.description ?? "",
        },
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        state.templates.push(template);
      });
      saveTemplate(template).catch(console.error);
    },

    updateTemplate: (id, updates) => {
      set((state) => {
        const t = state.templates.find((t) => t.id === id);
        if (!t) return;
        Object.assign(t, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      const t = get().templates.find((t) => t.id === id);
      if (t) saveTemplate(t).catch(console.error);
    },

    removeTemplate: (id) => {
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      });
      deleteTemplateDb(id).catch(console.error);
    },
  }))
);
