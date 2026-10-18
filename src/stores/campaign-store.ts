import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { Campaign, CreateCampaignInput } from "@/types/campaign";
import {
  fetchCampaignsByBrand,
  saveCampaign,
  deleteCampaignDb,
} from "@/lib/db/campaigns";

interface CampaignState {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  loadedBrandId: string | null;

  loadCampaigns: (brandId: string) => Promise<void>;
  createCampaign: (brandId: string, input: CreateCampaignInput) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  setActiveCampaign: (id: string | null) => void;
  getActiveCampaign: () => Campaign | undefined;
}

function syncCampaign(get: () => CampaignState, id?: string) {
  const campaign = get().campaigns.find(
    (c) => c.id === (id ?? get().activeCampaignId)
  );
  if (campaign) {
    saveCampaign(campaign).catch(console.error);
  }
}

export const useCampaignStore = create<CampaignState>()(
  immer((set, get) => ({
    campaigns: [],
    activeCampaignId: null,
    loadedBrandId: null,

    loadCampaigns: async (brandId) => {
      if (get().loadedBrandId === brandId && get().campaigns.length > 0) {
        return;
      }
      try {
        const campaigns = await fetchCampaignsByBrand(brandId);
        set((state) => {
          state.campaigns = campaigns;
          state.loadedBrandId = brandId;
          if (
            state.activeCampaignId &&
            !campaigns.find((c) => c.id === state.activeCampaignId)
          ) {
            state.activeCampaignId = null;
          }
        });
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      }
    },

    createCampaign: (brandId, input) => {
      const now = new Date().toISOString();
      const campaign: Campaign = {
        id: nanoid(),
        brandId,
        name: input.name,
        description: input.description,
        status: "draft",
        objective: input.objective,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        platforms: input.platforms,
        contentPillars: input.contentPillars,
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        state.campaigns.push(campaign);
        state.activeCampaignId = campaign.id;
      });
      saveCampaign(campaign).catch(console.error);
    },

    updateCampaign: (id, updates) => {
      set((state) => {
        const campaign = state.campaigns.find((c) => c.id === id);
        if (!campaign) return;
        Object.assign(campaign, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      syncCampaign(get, id);
    },

    deleteCampaign: (id) => {
      set((state) => {
        state.campaigns = state.campaigns.filter((c) => c.id !== id);
        if (state.activeCampaignId === id) {
          state.activeCampaignId = state.campaigns[0]?.id ?? null;
        }
      });
      deleteCampaignDb(id).catch(console.error);
    },

    setActiveCampaign: (id) => {
      set((state) => {
        state.activeCampaignId = id;
      });
    },

    getActiveCampaign: () => {
      const s = get();
      return s.campaigns.find((c) => c.id === s.activeCampaignId);
    },
  }))
);
