import { useState } from "react";
import { IconSpeakerphone } from "@tabler/icons-react";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { CampaignCard } from "./campaign-card";
import { CampaignForm } from "./campaign-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/types/campaign";
import type { CampaignStatus } from "@/types/common";

// ─── Component ──────────────────────────────────────────────────

interface CampaignListProps {
  statusFilter?: CampaignStatus | "all";
}

export function CampaignList({ statusFilter = "all" }: CampaignListProps) {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const updateCampaign = useCampaignStore((s) => s.updateCampaign);
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign);
  const storyboards = useStoryboardStore((s) => s.storyboards);

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Filter campaigns by status
  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  // Count storyboards per campaign
  function getStoryboardCount(campaignId: string): number {
    return storyboards.filter((sb) => sb.campaignId === campaignId).length;
  }

  if (filteredCampaigns.length === 0) {
    return (
      <EmptyState
        icon={IconSpeakerphone}
        title="No campaigns yet"
        description={
          statusFilter === "all"
            ? "Create your first campaign to start organizing content."
            : `No ${statusFilter} campaigns found.`
        }
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            isActive={campaign.id === activeCampaignId}
            storyboardCount={getStoryboardCount(campaign.id)}
            onClick={() => setActiveCampaign(campaign.id)}
            onEdit={() => setEditingCampaign(campaign)}
            onDelete={() => deleteCampaign(campaign.id)}
          />
        ))}
      </div>

      <CampaignForm
        open={!!editingCampaign}
        onOpenChange={(open) => !open && setEditingCampaign(null)}
        campaign={editingCampaign}
        onCreate={() => {}}
        onUpdate={updateCampaign}
      />
    </>
  );
}
