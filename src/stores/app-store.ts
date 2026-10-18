import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { ModuleId } from "@/types/common";

interface AppState {
  activeModule: ModuleId;
  sidebarOpen: boolean;
  globalSearchOpen: boolean;

  setActiveModule: (id: ModuleId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGlobalSearch: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      activeModule: "dashboard" as ModuleId,
      sidebarOpen: true,
      globalSearchOpen: false,

      setActiveModule: (id) => {
        set((state) => {
          state.activeModule = id;
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      toggleGlobalSearch: () => {
        set((state) => {
          state.globalSearchOpen = !state.globalSearchOpen;
        });
      },
    })),
    {
      name: "app-state-storage",
      partialize: (state) => ({
        activeModule: state.activeModule,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
