import { useMemo } from "react";
import {
  IconChartBar,
  IconFileText,
  IconFlag,
  IconDevices,
  IconClock,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import type { ContentPlatform } from "@/types/common";
import { PLATFORM_LABELS, CAMPAIGN_STATUS_LABELS } from "@/types/common";

// ─── Platform config ─────────────────────────────────────────────

const PLATFORM_BAR_CONFIG: Record<
  string,
  { label: string; icon: Icon; color: string }
> = {
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    color: "#E1306C",
  },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#69C9D0" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

// ─── Stat Card ───────────────────────────────────────────────────

function ReportStatCard({
  icon: StatIcon,
  label,
  value,
  color,
}: {
  icon: Icon;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-3 border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <StatIcon className="h-5 w-5" style={{ color }} />
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Horizontal Bar ──────────────────────────────────────────────

function HorizontalBar({
  label,
  icon: BarIcon,
  value,
  maxValue,
  color,
}: {
  label: string;
  icon: Icon;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-28 items-center gap-2 shrink-0">
        <BarIcon className="h-4 w-4 shrink-0" style={{ color }} />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 h-5 bg-muted relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-foreground tabular-nums shrink-0">
        {value}
      </span>
    </div>
  );
}

// ─── Campaign Progress Row ───────────────────────────────────────

function CampaignProgressRow({
  name,
  status,
  approved,
  total,
}: {
  name: string;
  status: string;
  approved: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <IconFlag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {name}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground capitalize shrink-0 ml-2">
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1 h-1.5" />
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {approved}/{total}
        </span>
      </div>
    </div>
  );
}

// ─── Timeline Item ───────────────────────────────────────────────

function TimelineItem({
  title,
  timestamp,
  dotColor,
}: {
  title: string;
  timestamp: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="flex flex-1 items-center justify-between pb-4 min-w-0">
        <span className="text-xs text-foreground truncate">{title}</span>
        <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
          {timestamp}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function ReportingPage() {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const frames = useStoryboardStore((s) => s.frames);

  // Count content by platform from frames and storyboard items
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Count from frames
    for (const frame of frames) {
      const p = frame.platform ?? "other";
      counts[p] = (counts[p] ?? 0) + 1;
    }

    // Count from legacy storyboard items
    for (const sb of storyboards) {
      for (const item of sb.items) {
        const p = item.platform ?? "other";
        counts[p] = (counts[p] ?? 0) + 1;
      }
    }

    return counts;
  }, [frames, storyboards]);

  const maxPlatformCount = Math.max(...Object.values(platformCounts), 1);

  // Unique platforms covered
  const platformsCovered = Object.keys(platformCounts).filter(
    (p) => p !== "other" && platformCounts[p] > 0,
  ).length;

  // Total content items
  const totalContent =
    frames.length +
    storyboards.reduce((acc, sb) => acc + sb.items.length, 0);

  // Active campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  // Campaign progress data
  const campaignProgress = campaigns.map((c) => {
    const sbsForCampaign = storyboards.filter(
      (sb) => sb.campaignId === c.id,
    );
    const allItems = sbsForCampaign.flatMap((sb) => sb.items);
    const approvedItems = allItems.filter(
      (i) => i.status === "approved" || i.status === "generated",
    ).length;
    return {
      name: c.name,
      status: c.status,
      approved: approvedItems,
      total: allItems.length,
    };
  });

  // Recent activity timeline
  const timelineItems: { title: string; timestamp: string; dotColor: string }[] =
    [];

  for (const c of campaigns.slice(0, 3)) {
    timelineItems.push({
      title: `Campaign "${c.name}" ${c.status === "draft" ? "created" : c.status}`,
      timestamp: new Date(c.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dotColor: "#f97316",
    });
  }

  for (const sb of storyboards.slice(0, 3)) {
    timelineItems.push({
      title: `Storyboard "${sb.name}" updated`,
      timestamp: new Date(sb.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dotColor: "#3b82f6",
    });
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Reporting</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Insights and analytics across your content workspace.
          </p>
        </div>

        <Separator />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStatCard
            icon={IconFileText}
            label="Content Created"
            value={totalContent}
            color="#f97316"
          />
          <ReportStatCard
            icon={IconFlag}
            label="Campaigns Active"
            value={activeCampaigns}
            color="#3b82f6"
          />
          <ReportStatCard
            icon={IconDevices}
            label="Platforms Covered"
            value={platformsCovered}
            color="#22c55e"
          />
          <ReportStatCard
            icon={IconClock}
            label="Avg Generation Time"
            value="--"
            color="#a855f7"
          />
        </div>

        <Separator />

        {/* Content by Platform */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Content by Platform
          </h2>
          {Object.keys(platformCounts).length === 0 ? (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconChartBar className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No content created yet. Create storyboards with frames to see
                platform distribution.
              </p>
            </div>
          ) : (
            <div className="space-y-2 border border-border bg-card p-4">
              {Object.entries(PLATFORM_BAR_CONFIG).map(
                ([platform, config]) => {
                  const count = platformCounts[platform] ?? 0;
                  if (count === 0) return null;
                  return (
                    <HorizontalBar
                      key={platform}
                      label={config.label}
                      icon={config.icon}
                      value={count}
                      maxValue={maxPlatformCount}
                      color={config.color}
                    />
                  );
                },
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Campaign Progress */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Campaign Progress
          </h2>
          {campaignProgress.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconFlag className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No campaigns to report on. Create a campaign to track progress.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {campaignProgress.map((cp) => (
                <CampaignProgressRow
                  key={cp.name}
                  name={cp.name}
                  status={cp.status}
                  approved={cp.approved}
                  total={cp.total}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Recent Activity Timeline */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Recent Activity
          </h2>
          {timelineItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconClock className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No recent activity to display.
              </p>
            </div>
          ) : (
            <div className="border border-border bg-card p-4">
              {timelineItems.map((item, idx) => (
                <TimelineItem
                  key={idx}
                  title={item.title}
                  timestamp={item.timestamp}
                  dotColor={item.dotColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
