import {
  IconSpeakerphone,
  IconCalendar,
  IconTarget,
  IconLayoutBoard,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconMail,
  IconWorld,
  IconDots,
  IconChartBar,
  IconEye,
  IconHeart,
  IconShare,
  IconArrowRight,
  IconClock,
  IconBrush,
} from "@tabler/icons-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useDesignStore } from "@/stores/design-store";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/shared/empty-state";
import type { CampaignStatus, ContentPlatform } from "@/types/common";
import {
  CAMPAIGN_STATUS_LABELS,
  PLATFORM_LABELS,
} from "@/types/common";

// ─── Platform icon mapping ──────────────────────────────────────

const PLATFORM_ICONS: Record<
  ContentPlatform,
  React.ComponentType<{ className?: string }>
> = {
  instagram: IconBrandInstagram,
  x: IconBrandX,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  newsletter: IconMail,
  website: IconWorld,
  other: IconDots,
};

// ─── Status badge styling ───────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-success/20 text-success",
  archived: "bg-muted text-muted-foreground",
};

// ─── Placeholder stats ──────────────────────────────────────────

const PLACEHOLDER_STATS = [
  { label: "Impressions", value: "--", icon: IconEye },
  { label: "Engagement", value: "--", icon: IconHeart },
  { label: "Shares", value: "--", icon: IconShare },
];

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(date: string | null): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────────

export function CampaignDetail() {
  const campaign = useCampaignStore((s) => s.getActiveCampaign());
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const frames = useStoryboardStore((s) => s.frames);
  const setActiveStoryboard = useStoryboardStore((s) => s.setActiveStoryboard);
  const calendarEvents = useCalendarStore((s) => s.events);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const designs = useDesignStore((s) => s.designs);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);

  if (!campaign) {
    return (
      <EmptyState
        icon={IconSpeakerphone}
        title="No campaign selected"
        description="Select a campaign from the sidebar to view its details."
      />
    );
  }

  const campaignStoryboards = storyboards.filter(
    (sb) => sb.campaignId === campaign.id
  );

  // Frame completion progress
  const campaignFrames = useMemo(
    () => frames.filter((f) => f.campaignId === campaign.id),
    [frames, campaign.id],
  );
  const completedFrameCount = useMemo(
    () =>
      campaignFrames.filter(
        (f) => f.status === "approved" || f.status === "published",
      ).length,
    [campaignFrames],
  );
  const frameProgress =
    campaignFrames.length > 0
      ? Math.round((completedFrameCount / campaignFrames.length) * 100)
      : 0;

  const campaignEvents = calendarEvents
    .filter((e) => e.campaignId === campaign.id)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  function navigateToStoryboard(storyboardId: string) {
    setActiveStoryboard(storyboardId);
    setActiveModule("storyboards");
  }

  function navigateToCalendar(date?: string) {
    if (date) setSelectedDate(date.slice(0, 10));
    setActiveModule("calendar");
  }

  // Designs linked through this campaign's frames
  const campaignFrameIds = new Set(campaignFrames.map((f) => f.id));
  const campaignDesigns = designs.filter(
    (d) => d.frameId && campaignFrameIds.has(d.frameId),
  );

  function navigateToDesign(designId: string) {
    setActiveDesign(designId);
    setActiveModule("design-studio");
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">
              {campaign.name}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                STATUS_BADGE_CLASSES[campaign.status]
              )}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </div>

          {campaign.description && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
          )}

          {/* Frame completion progress */}
          {campaignFrames.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Frame Progress
                </span>
                <span className="text-[11px] font-medium text-foreground">
                  {completedFrameCount} of {campaignFrames.length} frames
                  complete
                </span>
              </div>
              <Progress value={frameProgress} />
            </div>
          )}
        </div>

        <Separator />

        {/* ── Objective ────────────────────────────────────── */}
        {campaign.objective && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Objective</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground pl-6">
              {campaign.objective}
            </p>
          </div>
        )}

        {/* ── Date range ───────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Schedule</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Start
              </p>
              <p className="text-[13px] text-foreground">
                {formatDate(campaign.startDate)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                End
              </p>
              <p className="text-[13px] text-foreground">
                {formatDate(campaign.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Platforms ────────────────────────────────────── */}
        {campaign.platforms.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-foreground">Platforms</h2>
            <div className="flex flex-wrap gap-1.5">
              {campaign.platforms.map((platform) => {
                const Icon = PLATFORM_ICONS[platform];
                return (
                  <Badge key={platform} variant="outline" className="gap-1.5 px-2 py-1">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px]">
                      {PLATFORM_LABELS[platform]}
                    </span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Content Pillars ─────────────────────────────── */}
        {campaign.contentPillars.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-foreground">
              Content Pillars
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {campaign.contentPillars.map((pillar) => (
                <Badge key={pillar} variant="secondary" className="text-[11px]">
                  {pillar}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* ── Storyboards ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconLayoutBoard className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              Storyboards
            </h2>
            <span className="text-[11px] text-muted-foreground">
              ({campaignStoryboards.length})
            </span>
          </div>

          {campaignStoryboards.length > 0 ? (
            <div className="flex flex-col gap-1.5 pl-6">
              {campaignStoryboards.map((sb) => (
                <button
                  key={sb.id}
                  type="button"
                  onClick={() => navigateToStoryboard(sb.id)}
                  className="group flex items-center justify-between border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <IconLayoutBoard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13px] text-foreground">
                      {sb.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {sb.items?.length ?? 0} items
                    </span>
                    <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="pl-6 text-[13px] text-muted-foreground">
              No storyboards linked to this campaign yet.
            </p>
          )}
        </div>

        {/* ── Linked Designs ──────────────────────────────────── */}
        {campaignDesigns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconBrush className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Designs
              </h2>
              <span className="text-[11px] text-muted-foreground">
                ({campaignDesigns.length})
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pl-6">
              {campaignDesigns.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => navigateToDesign(d.id)}
                  className="group flex items-center justify-between border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <IconBrush className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13px] text-foreground">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {d.width}x{d.height}
                    </Badge>
                    <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Calendar Events ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Calendar Events
              </h2>
              <span className="text-[11px] text-muted-foreground">
                ({campaignEvents.length})
              </span>
            </div>
            {campaignEvents.length > 0 && (
              <button
                type="button"
                onClick={() => navigateToCalendar(campaignEvents[0]?.scheduledAt)}
                className="text-[11px] text-primary hover:underline"
              >
                View in Calendar
              </button>
            )}
          </div>

          {campaignEvents.length > 0 ? (
            <div className="flex flex-col gap-1.5 pl-6">
              {campaignEvents.slice(0, 5).map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => navigateToCalendar(evt.scheduledAt)}
                  className="group flex items-center justify-between border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <IconClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-[13px] text-foreground truncate">
                      {evt.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(evt.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {evt.platforms && evt.platforms.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {evt.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
                      </span>
                    )}
                    <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
              {campaignEvents.length > 5 && (
                <button
                  type="button"
                  onClick={() => navigateToCalendar(campaignEvents[0]?.scheduledAt)}
                  className="text-[11px] text-muted-foreground hover:text-foreground pl-6"
                >
                  +{campaignEvents.length - 5} more events
                </button>
              )}
            </div>
          ) : (
            <p className="pl-6 text-[13px] text-muted-foreground">
              No calendar events linked to this campaign yet.
            </p>
          )}
        </div>

        <Separator />

        {/* ── Stats (placeholder) ──────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              Campaign Stats
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PLACEHOLDER_STATS.map(({ label, value, icon: StatIcon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 border border-border bg-card p-3"
              >
                <StatIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {value}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Campaign analytics will be available once content is published.
          </p>
        </div>

        {/* ── Metadata ─────────────────────────────────────── */}
        <Separator />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Created{" "}
            {new Date(campaign.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>
            Updated{" "}
            {new Date(campaign.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </ScrollArea>
  );
}
