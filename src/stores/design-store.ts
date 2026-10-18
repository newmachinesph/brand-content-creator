import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { Design, CreateDesignInput, DesignSpec } from "@/types/design";
import {
  fetchDesignsByBrand,
  saveDesign,
  deleteDesignDb,
} from "@/lib/db/designs";
import { useBrandStore } from "./brand-store";

interface DesignState {
  designs: Design[];
  activeDesignId: string | null;
  loadedBrandId: string | null;
  activeDesignSpec: DesignSpec | null;

  loadDesigns: (brandId: string) => Promise<void>;
  addDesign: (input: CreateDesignInput) => string;
  updateDesign: (id: string, updates: Partial<Design>) => void;
  removeDesign: (id: string) => void;
  setActiveDesign: (id: string | null) => void;
  getActiveDesign: () => Design | undefined;
  setActiveDesignSpec: (spec: DesignSpec | null) => void;
}

export const useDesignStore = create<DesignState>()(
  immer((set, get) => ({
    designs: [],
    activeDesignId: null,
    loadedBrandId: null,
    activeDesignSpec: null,

    loadDesigns: async (brandId) => {
      if (get().loadedBrandId === brandId && get().designs.length > 0) {
        return;
      }
      try {
        const rows = await fetchDesignsByBrand(brandId);
        set((state) => {
          state.designs = rows;
          state.loadedBrandId = brandId;
        });
      } catch (err) {
        console.error("Failed to load designs:", err);
      }
    },

    addDesign: (input) => {
      const brandId = useBrandStore.getState().activeBrandId;
      if (!brandId) return "";

      const now = new Date().toISOString();
      const id = nanoid();

      const design: Design = {
        id,
        brandId,
        frameId: input.frameId,
        name: input.name,
        canvasJson: input.canvasJson ?? { version: "6.0.0", objects: [] },
        width: input.width,
        height: input.height,
        platform: input.platform,
        format: input.format,
        status: "draft",
        data: {},
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        state.designs.push(design);
        state.activeDesignId = id;
      });
      saveDesign(design).catch(console.error);
      return id;
    },

    updateDesign: (id, updates) => {
      set((state) => {
        const design = state.designs.find((d) => d.id === id);
        if (!design) return;
        Object.assign(design, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      const design = get().designs.find((d) => d.id === id);
      if (design) saveDesign(design).catch(console.error);
    },

    removeDesign: (id) => {
      set((state) => {
        state.designs = state.designs.filter((d) => d.id !== id);
        if (state.activeDesignId === id) state.activeDesignId = null;
      });
      deleteDesignDb(id).catch(console.error);
    },

    setActiveDesign: (id) => {
      set((state) => {
        state.activeDesignId = id;
      });
    },

    getActiveDesign: () => {
      const { designs, activeDesignId } = get();
      return designs.find((d) => d.id === activeDesignId);
    },

    setActiveDesignSpec: (spec) => {
      set((state) => {
        state.activeDesignSpec = spec;
      });
    },
  }))
);
