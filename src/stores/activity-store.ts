import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ActivityLogEntry } from "@/types/activity-log";
import { fetchActivityLog } from "@/lib/db/activity-log";

// ─── Store interface ─────────────────────────────────────────────

interface ActivityState {
  entries: ActivityLogEntry[];
  loading: boolean;
  loadedBrandId: string | null;
  filters: {
    startDate?: string;
    endDate?: string;
    action?: string;
    entityType?: string;
  };

  loadEntries: (brandId: string) => Promise<void>;
  setFilters: (filters: Partial<ActivityState["filters"]>) => void;
  addEntry: (entry: ActivityLogEntry) => void;
}

export const useActivityStore = create<ActivityState>()(
  immer((set, get) => ({
    entries: [],
    loading: false,
    loadedBrandId: null,
    filters: {},

    loadEntries: async (brandId) => {
      set((state) => {
        state.loading = true;
      });
      try {
        const { filters } = get();
        const rows = await fetchActivityLog(brandId, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          action: filters.action,
          entityType: filters.entityType,
        });
        set((state) => {
          state.entries = rows;
          state.loadedBrandId = brandId;
          state.loading = false;
        });
      } catch (err) {
        console.error("Failed to load activity log:", err);
        set((state) => {
          state.loading = false;
        });
      }
    },

    setFilters: (filters) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      });
    },

    addEntry: (entry) => {
      set((state) => {
        state.entries.unshift(entry);
      });
    },
  }))
);
