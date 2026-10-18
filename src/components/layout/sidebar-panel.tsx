import { useState } from "react";
import {
  IconMicrophone,
  IconMessage,
  IconPencil,
  IconPalette,
  IconUsers,
  IconStar,
  IconAlertTriangle,
  IconPackage,
  IconPlus,
  IconFile,
  IconList,
  IconSparkles,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useBrandStore } from "@/stores/brand-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { BrandSwitcher } from "./brand-switcher";
import { StoryboardList } from "@/components/storyboard/storyboard-list";
import { CampaignSidebar } from "@/components/campaigns/campaign-sidebar";
import { MemorySidebar } from "@/components/brand-memory/memory-sidebar";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { AssetSidebar } from "@/components/assets/asset-sidebar";
import { ReportingSidebar } from "@/components/reporting/reporting-sidebar";
import { SpecsSidebar } from "@/components/platform-specs/specs-sidebar";
import { ExportSidebar } from "@/components/export/export-sidebar";
import { TemplateSidebar } from "@/components/templates/template-sidebar";
import { DesignSidebar } from "@/components/design-studio/design-sidebar";
import { ChatSidebar } from "@/components/brand-chat/chat-sidebar";
import { ActivitySidebar } from "@/components/activity-log/activity-sidebar";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import type { BrandSection } from "@/types/brand";
import type { ModuleId } from "@/types/common";

const DEFAULT_SECTION_IDS = new Set([
  "brand-voice",
  "messaging-framework",
  "style-guide",
  "visual-identity",
  "target-audiences",
  "content-examples",
  "anti-examples",
  "products",
]);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  IconMicrophone,
  IconMessage,
  IconPencil,
  IconPalette,
  IconUsers,
  IconStar,
  IconAlertTriangle,
  IconPackage,
  IconFile,
  IconList,
};

function SectionIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? IconFile;
  return <Icon className={className} />;
}

function SectionNavItem({
  section,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  section: BrandSection;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const activeSectionId = useBrandStore((s) => s.activeSectionId);
  const setActiveSection = useBrandStore((s) => s.setActiveSection);
  const isActive = activeSectionId === section.id;
  const isDeletable = !!onDelete;

  return (
    <div className="group relative">
      <button
        onClick={() => setActiveSection(section.id)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <SectionIcon
          icon={section.icon}
          className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")}
        />
        <span className="truncate">{section.label}</span>
        {section.kind === "list" && !isDeletable && !onMoveUp && !onMoveDown && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {section.items.length}
          </span>
        )}
      </button>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onMoveUp && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            title="Move up"
          >
            <IconChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            title="Move down"
          >
            <IconChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        {isDeletable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete section"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Module-specific sidebar content ─────────────────────────────

function BrandVaultSidebar({
  onAddSection,
  onAutoFill,
}: {
  onAddSection: () => void;
  onAutoFill: () => void;
}) {
  const activeBrand = useBrandStore((s) =>
    s.brandKits.find((b) => b.id === s.activeBrandId)
  );
  const clearAllSections = useBrandStore((s) => s.clearAllSections);
  const removeSection = useBrandStore((s) => s.removeSection);
  const moveSectionUp = useBrandStore((s) => s.moveSectionUp);
  const moveSectionDown = useBrandStore((s) => s.moveSectionDown);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  if (!activeBrand) return null;

  const hasContent = activeBrand.sections.some((s) =>
    s.kind === "document"
      ? s.content.trim().length > 0
      : s.items.length > 0
  );

  const deleteSectionLabel =
    deleteSectionId
      ? activeBrand.sections.find((s) => s.id === deleteSectionId)?.label
      : null;

  return (
    <>
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {activeBrand.sections.map((section, index) => (
            <SectionNavItem
              key={section.id}
              section={section}
              onDelete={
                DEFAULT_SECTION_IDS.has(section.id)
                  ? undefined
                  : () => setDeleteSectionId(section.id)
              }
              onMoveUp={
                index > 0
                  ? () => moveSectionUp(section.id)
                  : undefined
              }
              onMoveDown={
                index < activeBrand.sections.length - 1
                  ? () => moveSectionDown(section.id)
                  : undefined
              }
            />
          ))}
        </div>
      </ScrollArea>
      <div className="space-y-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-primary hover:text-primary"
          onClick={onAutoFill}
        >
          <IconSparkles className="h-4 w-4" />
          Auto-fill with AI
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onAddSection}
        >
          <IconPlus className="h-4 w-4" />
          Add Section
        </Button>
        {hasContent && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => setClearConfirmOpen(true)}
          >
            <IconTrash className="h-4 w-4" />
            Clear All Content
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear all brand vault content?"
        description="This will permanently erase all content from every section in the brand vault. This action cannot be undone."
        confirmLabel="Clear All"
        onConfirm={clearAllSections}
      />
      <ConfirmDialog
        open={!!deleteSectionId}
        onOpenChange={(open) => {
          if (!open) setDeleteSectionId(null);
        }}
        title={`Delete "${deleteSectionLabel}" section?`}
        description="This will permanently remove this section and all its content. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteSectionId) {
            removeSection(deleteSectionId);
            setDeleteSectionId(null);
          }
        }}
      />
    </>
  );
}

function StoryboardsSidebar({
  onCreateStoryboard,
}: {
  onCreateStoryboard: () => void;
}) {
  return (
    <>
      <ScrollArea className="flex-1 px-2 py-2">
        <StoryboardList />
      </ScrollArea>
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onCreateStoryboard}
        >
          <IconPlus className="h-4 w-4" />
          New Storyboard
        </Button>
      </div>
    </>
  );
}

function MinimalSidebar({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <p className="text-center text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

// ─── Main sidebar panel ──────────────────────────────────────────

const MODULE_LABELS: Record<ModuleId, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  "brand-vault": "Brand Vault",
  "brand-memory": "Brand Memory",
  "brand-chat": "Brand Chat",
  campaigns: "Campaigns",
  storyboards: "Storyboards",
  assets: "Assets",
  templates: "Templates",
  "platform-specs": "Platform Specs",
  export: "Export",
  reporting: "Reporting",
  "design-studio": "Design Studio",
  "activity-log": "Activity Log",
  settings: "Settings",
};

interface SidebarPanelProps {
  onAddSection: () => void;
  onAutoFill: () => void;
  onCreateBrand: () => void;
  onCreateStoryboard: () => void;
  onCreateMemory: () => void;
}

export function SidebarPanel({
  onAddSection,
  onAutoFill,
  onCreateBrand,
  onCreateStoryboard,
  onCreateMemory,
}: SidebarPanelProps) {
  const activeModule = useAppStore((s) => s.activeModule);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <div className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
      {/* Brand switcher */}
      <div className="px-3 pb-2 pt-10">
        <BrandSwitcher onCreateBrand={onCreateBrand} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Module-specific content */}
      {activeModule === "brand-vault" && (
        <BrandVaultSidebar onAddSection={onAddSection} onAutoFill={onAutoFill} />
      )}
      {activeModule === "storyboards" && (
        <StoryboardsSidebar onCreateStoryboard={onCreateStoryboard} />
      )}
      {activeModule === "campaigns" && <CampaignSidebar />}
      {activeModule === "brand-memory" && (
        <MemorySidebar onCreateMemory={onCreateMemory} />
      )}
      {activeModule === "calendar" && <CalendarSidebar />}
      {activeModule === "dashboard" && <DashboardSidebar />}
      {activeModule === "assets" && (
        <AssetSidebar onUpload={() => {
          // Dispatch custom event that AssetPage listens for
          window.dispatchEvent(new CustomEvent("asset-upload-trigger"));
        }} />
      )}
      {activeModule === "reporting" && <ReportingSidebar />}
      {activeModule === "platform-specs" && <SpecsSidebar />}
      {activeModule === "export" && <ExportSidebar />}
      {activeModule === "templates" && <TemplateSidebar />}
      {activeModule === "design-studio" && <DesignSidebar />}
      {activeModule === "brand-chat" && <ChatSidebar />}
      {activeModule === "activity-log" && <ActivitySidebar />}
      {activeModule === "settings" && <SettingsSidebar />}
      {activeModule !== "brand-vault" &&
        activeModule !== "storyboards" &&
        activeModule !== "campaigns" &&
        activeModule !== "brand-memory" &&
        activeModule !== "brand-chat" &&
        activeModule !== "calendar" &&
        activeModule !== "dashboard" &&
        activeModule !== "assets" &&
        activeModule !== "reporting" &&
        activeModule !== "platform-specs" &&
        activeModule !== "export" &&
        activeModule !== "templates" &&
        activeModule !== "design-studio" &&
        activeModule !== "activity-log" &&
        activeModule !== "settings" && (
          <MinimalSidebar label={MODULE_LABELS[activeModule]} />
        )}
    </div>
  );
}
