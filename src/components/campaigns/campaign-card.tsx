import { useState } from "react";
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconLayoutBoard,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconMail,
  IconWorld,
  IconDots as IconOther,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/campaign";
import type { CampaignStatus, ContentPlatform } from "@/types/common";
import { CAMPAIGN_STATUS_LABELS, PLATFORM_LABELS } from "@/types/common";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

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
  other: IconOther,
};

// ─── Status badge styling ───────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-success/20 text-success",
  archived: "bg-muted text-muted-foreground",
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString("en-US", { month: "short" })} ${s.getDate()} - ${e.getDate()}`;
    }
    return `${fmt(start)} - ${fmt(end)}`;
  }
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

// ─── Component ──────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign;
  isActive: boolean;
  storyboardCount?: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CampaignCard({
  campaign,
  isActive,
  storyboardCount = 0,
  onClick,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dateRange = formatDateRange(campaign.startDate, campaign.endDate);

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full flex-col gap-2 border p-3 text-left transition-colors",
          isActive
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-border/80 hover:bg-card/80"
        )}
      >
        {/* Header: name + status + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {campaign.name}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
                STATUS_BADGE_CLASSES[campaign.status]
              )}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 shrink-0 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Bottom row: platforms, date, storyboard count */}
        <div className="flex items-center gap-2">
          {/* Platform icons */}
          {campaign.platforms.length > 0 && (
            <div className="flex items-center gap-1">
              {(() => {
                const Icon = PLATFORM_ICONS[campaign.platforms[0]];
                return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
              })()}
              {campaign.platforms.length > 1 && (
                <span className="text-[11px] text-muted-foreground">
                  +{campaign.platforms.length - 1}
                </span>
              )}
            </div>
          )}

          {/* Date range */}
          {dateRange && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <IconCalendar className="h-3 w-3" />
              <span>{dateRange}</span>
            </div>
          )}

          {/* Storyboard count */}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            <IconLayoutBoard className="h-3 w-3" />
            <span>{storyboardCount}</span>
          </div>
        </div>
      </button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete campaign?"
        description={`This will permanently remove "${campaign.name}" and all associated data.`}
        onConfirm={onDelete}
      />
    </>
  );
}
