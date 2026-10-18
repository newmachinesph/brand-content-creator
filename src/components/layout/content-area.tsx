import { useBrandStore } from "@/stores/brand-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useAppStore } from "@/stores/app-store";
import { SectionEditor } from "@/components/brand-vault/section-editor";
import { StoryboardEditor } from "@/components/storyboard/storyboard-editor";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";
import { MemoryPage } from "@/components/brand-memory/memory-page";
import { ChatPage } from "@/components/brand-chat/chat-page";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { AssetPage } from "@/components/assets/asset-page";
import { TemplatePage } from "@/components/templates/template-page";
import { SpecsPage } from "@/components/platform-specs/specs-page";
import { ExportPage } from "@/components/export/export-page";
import { ReportingPage } from "@/components/reporting/reporting-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { DesignStudioPage } from "@/components/design-studio/design-studio-page";
import { ActivityLogPage } from "@/components/activity-log/activity-log-page";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleErrorBoundary } from "@/components/shared/module-error-boundary";
import {
  IconClick,
  IconLayoutBoard,
  IconFlag,
} from "@tabler/icons-react";

function ModuleContent({ activeModule }: { activeModule: string }) {
  const activeSectionId = useBrandStore((s) => s.activeSectionId);
  const activeStoryboardId = useStoryboardStore((s) => s.activeStoryboardId);
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);

  if (activeModule === "dashboard") {
    return <DashboardPage />;
  }

  if (activeModule === "calendar") {
    return <CalendarPage />;
  }

  if (activeModule === "brand-vault") {
    if (!activeSectionId) {
      return (
        <EmptyState
          icon={IconClick}
          title="No section selected"
          description="Pick a section from the sidebar to start editing."
        />
      );
    }
    return <SectionEditor sectionId={activeSectionId} />;
  }

  if (activeModule === "storyboards") {
    if (!activeStoryboardId) {
      return (
        <EmptyState
          icon={IconLayoutBoard}
          title="No storyboard selected"
          description="Select a storyboard from the sidebar or create a new one."
        />
      );
    }
    return <StoryboardEditor />;
  }

  if (activeModule === "campaigns") {
    if (!activeCampaignId) {
      return (
        <EmptyState
          icon={IconFlag}
          title="No campaign selected"
          description="Select a campaign from the sidebar or create a new one."
        />
      );
    }
    return <CampaignDetail />;
  }

  if (activeModule === "brand-memory") {
    return <MemoryPage />;
  }

  if (activeModule === "brand-chat") {
    return <ChatPage />;
  }

  if (activeModule === "assets") {
    return <AssetPage />;
  }

  if (activeModule === "templates") {
    return <TemplatePage />;
  }

  if (activeModule === "platform-specs") {
    return <SpecsPage />;
  }

  if (activeModule === "export") {
    return <ExportPage />;
  }

  if (activeModule === "reporting") {
    return <ReportingPage />;
  }

  if (activeModule === "design-studio") {
    return <DesignStudioPage />;
  }

  if (activeModule === "activity-log") {
    return <ActivityLogPage />;
  }

  if (activeModule === "settings") {
    return <SettingsPage />;
  }

  return null;
}

export function ContentArea() {
  const activeModule = useAppStore((s) => s.activeModule);

  return (
    <ModuleErrorBoundary key={activeModule} moduleName={activeModule}>
      <ModuleContent activeModule={activeModule} />
    </ModuleErrorBoundary>
  );
}
