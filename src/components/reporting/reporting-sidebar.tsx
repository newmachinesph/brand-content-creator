import { useMemo } from "react";
import {
  IconChartBar,
  IconFileText,
  IconFlag,
  IconDevices,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { cn } from "@/lib/utils";

const PLATFORM_CONFIG: Record<string, { label: string; icon: Icon; color: string }> = {
  instagram: { label: "Instagram", icon: IconBrandInstagram, color: "#E1306C" },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#69C9D0" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

export function ReportingSidebar() {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const frames = useStoryboardStore((s) => s.frames);

  const stats = useMemo(() => {
    const platformCounts: Record<string, number> = {};
    for (const frame of frames) {
      const p = frame.platform ?? "other";
      platformCounts[p] = (platformCounts[p] ?? 0) + 1;
    }
    for (const sb of storyboards) {
      for (const item of sb.items) {
        const p = item.platform ?? "other";
        platformCounts[p] = (platformCounts[p] ?? 0) + 1;
      }
    }

    const totalContent = frames.length + storyboards.reduce((acc, sb) => acc + sb.items.length, 0);
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;
    const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;

    return {
      totalContent,
      activeCampaigns,
      draftCampaigns,
      completedCampaigns,
      totalCampaigns: campaigns.length,
      platformCounts,
    };
  }, [campaigns, storyboards, frames]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Overview */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Overview
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconFileText className="h-4 w-4 shrink-0 text-orange-400" />
              <span className="flex-1 text-sidebar-foreground/70">Content Items</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.totalContent}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconFlag className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="flex-1 text-sidebar-foreground/70">Total Campaigns</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.totalCampaigns}
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Campaign Status */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Campaign Status
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <div className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
              <span className="flex-1 text-sidebar-foreground/70">Active</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.activeCampaigns}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <div className="h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
              <span className="flex-1 text-sidebar-foreground/70">Draft</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.draftCampaigns}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <div className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
              <span className="flex-1 text-sidebar-foreground/70">Completed</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.completedCampaigns}
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Platform Breakdown */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Platform
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const count = stats.platformCounts[key] ?? 0;
              if (count === 0) return null;
              const PIcon = config.icon;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <PIcon className="h-4 w-4 shrink-0" style={{ color: config.color }} />
                  <span className="flex-1 text-sidebar-foreground/70">{config.label}</span>
                  <span className="text-[12px] font-medium tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
            {Object.values(stats.platformCounts).every((c) => c === 0) && (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                No content yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
