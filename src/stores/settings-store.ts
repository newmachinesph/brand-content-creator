import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

interface AppSettings {
  theme: "dark" | "light" | "system";
  defaultPlatform: string;
  claudeModel: string;
  autoSave: boolean;
  compactMode: boolean;
}

interface SettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  defaultPlatform: "instagram",
  claudeModel: "claude-sonnet-4-6",
  autoSave: true,
  compactMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      settings: { ...DEFAULT_SETTINGS },

      updateSetting: (key, value) => {
        set((state) => {
          state.settings[key] = value;
        });
      },

      resetSettings: () => {
        set((state) => {
          state.settings = { ...DEFAULT_SETTINGS };
        });
      },
    })),
    {
      name: "brand-studio-settings",
      version: 1,
      migrate: () => ({ settings: { ...DEFAULT_SETTINGS } }),
    }
  )
);
