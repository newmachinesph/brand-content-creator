import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBrandStore } from "@/stores/brand-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useAssetStore } from "@/stores/asset-store";
import { useTemplateStore } from "@/stores/template-store";
import { useDesignStore } from "@/stores/design-store";
import { useAppStore } from "@/stores/app-store";
import { RailNav } from "./rail-nav";
import { SidebarPanel } from "./sidebar-panel";
import { Header } from "./header";
import { ContentArea } from "./content-area";
import { BrandSetupScreen } from "@/components/brand-vault/brand-setup-screen";
import { AddSectionDialog } from "@/components/brand-vault/add-section-dialog";
import { CreateStoryboardDialog } from "@/components/storyboard/create-storyboard-dialog";
import { MemoryForm } from "@/components/brand-memory/memory-form";
import { AutoFillDialog } from "@/components/brand-vault/auto-fill-dialog";
import { IconLoader2 } from "@tabler/icons-react";

export function AppShell() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const brandKits = useBrandStore((s) => s.brandKits);
  const dbLoaded = useBrandStore((s) => s.dbLoaded);
  const loadStoryboards = useStoryboardStore((s) => s.loadStoryboards);
  const createStoryboard = useStoryboardStore((s) => s.createStoryboard);
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns);
  const loadMemories = useMemoryStore((s) => s.loadMemories);
  const loadAssets = useAssetStore((s) => s.loadAssets);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);
  const loadDesigns = useDesignStore((s) => s.loadDesigns);
  const activeModule = useAppStore((s) => s.activeModule);

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [showCreateBrand, setShowCreateBrand] = useState(false);
  const [createStoryboardOpen, setCreateStoryboardOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [createMemoryOpen, setCreateMemoryOpen] = useState(false);
  const [autoFillOpen, setAutoFillOpen] = useState(false);

  // Load storyboards, campaigns, and memories when active brand changes
  useEffect(() => {
    if (activeBrandId) {
      loadStoryboards(activeBrandId);
      loadCampaigns(activeBrandId);
      loadMemories(activeBrandId);
      loadAssets(activeBrandId);
      loadTemplates(activeBrandId);
      loadDesigns(activeBrandId);
    }
  }, [activeBrandId, loadStoryboards, loadCampaigns, loadMemories, loadAssets, loadTemplates, loadDesigns]);

  // Wait for DB to finish loading before showing UI
  if (!dbLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background bg-terminal-pattern">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show setup screen when no brands exist, or user chose to create a new one
  const activeBrand = brandKits.find((b) => b.id === activeBrandId);
  if (!activeBrand || showCreateBrand) {
    return (
      <BrandSetupScreen
        onBack={
          activeBrand && showCreateBrand
            ? () => setShowCreateBrand(false)
            : undefined
        }
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background bg-terminal-pattern font-sans antialiased">
        {/* Zone 1: Rail */}
        <RailNav />

        {/* Zone 2: Sidebar */}
        <SidebarPanel
          onAddSection={() => setAddSectionOpen(true)}
          onAutoFill={() => setAutoFillOpen(true)}
          onCreateBrand={() => setShowCreateBrand(true)}
          onCreateStoryboard={() => setCreateStoryboardOpen(true)}
          onCreateMemory={() => setCreateMemoryOpen(true)}
        />

        {/* Zone 3: Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">
            <ContentArea />
          </main>
        </div>

        {/* Dialogs */}
        <AddSectionDialog
          open={addSectionOpen}
          onOpenChange={setAddSectionOpen}
        />
        <CreateStoryboardDialog
          open={createStoryboardOpen}
          onOpenChange={setCreateStoryboardOpen}
          onCreate={(name, description) =>
            createStoryboard(activeBrandId!, name, description)
          }
        />
        <MemoryForm
          open={createMemoryOpen}
          onOpenChange={setCreateMemoryOpen}
        />
        <AutoFillDialog
          open={autoFillOpen}
          onOpenChange={setAutoFillOpen}
        />
      </div>
    </TooltipProvider>
  );
}
