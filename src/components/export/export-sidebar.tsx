import { useMemo } from "react";
import {
  IconPackageExport,
  IconFileZip,
  IconBrandGoogleDrive,
  IconCheck,
  IconCircle,
  IconClock,
  IconFlag,
  IconLayoutBoard,
  IconPhoto,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useAssetStore } from "@/stores/asset-store";
import { cn } from "@/lib/utils";

export function ExportSidebar() {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const assets = useAssetStore((s) => s.assets);

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalStoryboards = storyboards.length;
  const totalAssets = assets.length;

  // Simple readiness score based on content availability
  const readinessItems = useMemo(() => {
    const items = [
      { label: "Campaigns created", done: campaigns.length > 0 },
      { label: "Storyboards ready", done: storyboards.length > 0 },
      { label: "Assets uploaded", done: assets.length > 0 },
    ];
    return items;
  }, [campaigns.length, storyboards.length, assets.length]);

  const readyCount = readinessItems.filter((i) => i.done).length;
  const readinessPercent = readinessItems.length > 0
    ? Math.round((readyCount / readinessItems.length) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Readiness */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Readiness
          </p>
          <div className="flex items-baseline justify-between">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                readinessPercent === 100 ? "text-green-400" : "text-foreground",
              )}
            >
              {readinessPercent}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {readyCount}/{readinessItems.length} ready
            </span>
          </div>
          <Progress
            value={readinessPercent}
            className={cn(
              "h-1.5",
              readinessPercent === 100 && "[&_[data-slot=progress-indicator]]:bg-green-400",
            )}
          />
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Checklist */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Checklist
          </p>
          <div className="flex flex-col gap-1">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
              >
                {item.done ? (
                  <IconCheck className="h-3.5 w-3.5 shrink-0 text-green-400" />
                ) : (
                  <IconCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                )}
                <span
                  className={cn(
                    "flex-1",
                    item.done
                      ? "text-sidebar-foreground/50 line-through"
                      : "text-sidebar-foreground/70",
                  )}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Content Summary */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Content
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconFlag className="h-4 w-4 shrink-0 text-orange-400" />
              <span className="flex-1 text-sidebar-foreground/70">Campaigns</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {activeCampaigns}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconLayoutBoard className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="flex-1 text-sidebar-foreground/70">Storyboards</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {totalStoryboards}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconPhoto className="h-4 w-4 shrink-0 text-green-400" />
              <span className="flex-1 text-sidebar-foreground/70">Assets</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {totalAssets}
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Export Formats */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Formats
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconFileZip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sidebar-foreground/70">ZIP Archive</span>
              <span className="text-[10px] text-muted-foreground">Soon</span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconBrandGoogleDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sidebar-foreground/70">Google Drive</span>
              <span className="text-[10px] text-muted-foreground">Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
