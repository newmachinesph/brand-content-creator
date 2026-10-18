import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { Asset, CreateAssetInput } from "@/types/asset";
import {
  fetchAssetsByBrand,
  saveAsset,
  deleteAssetDb,
} from "@/lib/db/assets";
import { useBrandStore } from "./brand-store";

interface AssetState {
  assets: Asset[];
  loadedBrandId: string | null;

  loadAssets: (brandId: string) => Promise<void>;
  addAsset: (input: CreateAssetInput) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
}

export const useAssetStore = create<AssetState>()(
  immer((set, get) => ({
    assets: [],
    loadedBrandId: null,

    loadAssets: async (brandId) => {
      if (get().loadedBrandId === brandId && get().assets.length > 0) {
        return;
      }
      try {
        const rows = await fetchAssetsByBrand(brandId);
        set((state) => {
          state.assets = rows;
          state.loadedBrandId = brandId;
        });
      } catch (err) {
        console.error("Failed to load assets:", err);
      }
    },

    addAsset: (input) => {
      const brandId = useBrandStore.getState().activeBrandId;
      if (!brandId) return;

      const now = new Date().toISOString();
      const asset: Asset = {
        id: nanoid(),
        brandId,
        frameId: input.frameId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
        width: input.width,
        height: input.height,
        version: 1,
        tags: input.tags ?? [],
        data: {},
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        state.assets.push(asset);
      });
      saveAsset(asset).catch(console.error);
    },

    updateAsset: (id, updates) => {
      set((state) => {
        const asset = state.assets.find((a) => a.id === id);
        if (!asset) return;
        Object.assign(asset, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      const asset = get().assets.find((a) => a.id === id);
      if (asset) saveAsset(asset).catch(console.error);
    },

    removeAsset: (id) => {
      set((state) => {
        state.assets = state.assets.filter((a) => a.id !== id);
      });
      deleteAssetDb(id).catch(console.error);
    },
  }))
);
