import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCampaignStore } from "@/stores/campaign-store";
import { useBrandStore } from "@/stores/brand-store";
import { CampaignList } from "./campaign-list";
import { CampaignForm } from "./campaign-form";
import type { CreateCampaignInput } from "@/types/campaign";

// ─── Component ──────────────────────────────────────────────────

export function CampaignSidebar() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const createCampaign = useCampaignStore((s) => s.createCampaign);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  function handleCreate(input: CreateCampaignInput) {
    if (!activeBrandId) return;
    createCampaign(activeBrandId, input);
  }

  return (
    <>
      <Tabs defaultValue="all" className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
        {/* Filter tabs */}
        <div className="shrink-0 px-2 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex-1">
              Draft
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Campaign lists */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <TabsContent value="all" className="mt-0">
            <CampaignList statusFilter="all" />
          </TabsContent>
          <TabsContent value="active" className="mt-0">
            <CampaignList statusFilter="active" />
          </TabsContent>
          <TabsContent value="draft" className="mt-0">
            <CampaignList statusFilter="draft" />
          </TabsContent>
        </div>

        {/* New Campaign button */}
        <div className="shrink-0 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCreateDialog(true)}
          >
            <IconPlus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </Tabs>

      <CampaignForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
      />
    </>
  );
}
