import {
  IconPalette,
  IconRobot,
  IconDevices,
  IconPrompt,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { create } from "zustand";

// ── Sidebar nav state (which section is active) ─────────────────

type SettingsSection = "appearance" | "ai-engine" | "defaults" | "prompt-templates";

interface SettingsSidebarState {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
}

export const useSettingsSidebar = create<SettingsSidebarState>((set) => ({
  activeSection: "appearance",
  setActiveSection: (section) => set({ activeSection: section }),
}));

// ── Nav items ───────────────────────────────────────────────────

const NAV_ITEMS: { id: SettingsSection; label: string; icon: Icon; description: string }[] = [
  { id: "appearance", label: "Appearance", icon: IconPalette, description: "Theme & layout" },
  { id: "ai-engine", label: "AI Engine", icon: IconRobot, description: "Model & auto-save" },
  { id: "defaults", label: "Defaults", icon: IconDevices, description: "Platform defaults" },
  { id: "prompt-templates", label: "Prompt Templates", icon: IconPrompt, description: "Customize AI prompts" },
];

// ── Component ───────────────────────────────────────────────────

export function SettingsSidebar() {
  const activeSection = useSettingsSidebar((s) => s.activeSection);
  const setActiveSection = useSettingsSidebar((s) => s.setActiveSection);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const NavIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <NavIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive && "text-sidebar-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
