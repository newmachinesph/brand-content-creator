import {
  IconPhoto,
  IconMail,
  IconArticle,
  IconSpeakerphone,
  IconBrowserCheck,
  IconVideo,
  IconFile,
  IconDots,
  IconEdit,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
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
import type { Frame } from "@/types/storyboard";
import type { ContentType, FrameStatus, ContentPlatform } from "@/types/common";
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  FRAME_STATUS_LABELS,
} from "@/types/common";

// ─── Content type icon mapping ─────────────────────────────────

const CONTENT_TYPE_ICONS: Record<
  ContentType,
  React.ComponentType<{ className?: string }>
> = {
  "social-post": IconPhoto,
  email: IconMail,
  "blog-article": IconArticle,
  "ad-copy": IconSpeakerphone,
  "landing-page": IconBrowserCheck,
  "video-script": IconVideo,
  custom: IconFile,
};

// ─── Status badge styling ──────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<FrameStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  briefed: "bg-blue-500/20 text-blue-400",
  in_production: "bg-orange-500/20 text-orange-400",
  review: "bg-purple-500/20 text-purple-400",
  approved: "bg-green-500/20 text-green-400",
  scheduled: "bg-cyan-500/20 text-cyan-400",
  published: "bg-emerald-500/20 text-emerald-400",
};

// ─── Component ─────────────────────────────────────────────────

interface FrameCardProps {
  frame: Frame;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function FrameCard({
  frame,
  isActive,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FrameCardProps) {
  const ContentIcon = CONTENT_TYPE_ICONS[frame.contentType];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-2 border p-3 text-left transition-colors",
        isActive
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:border-border/80 hover:bg-card/80"
      )}
    >
      {/* Header: sort order + title + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Sort order indicator */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-medium text-muted-foreground bg-muted">
            {frame.sortOrder}
          </span>

          <ContentIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className="truncate text-sm font-medium text-foreground">
            {frame.title}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onMoveUp && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
            >
              <IconArrowUp className="h-3.5 w-3.5" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
            >
              <IconArrowDown className="h-3.5 w-3.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Badges: platform + status */}
      <div className="flex items-center gap-1.5">
        {frame.platform && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {PLATFORM_LABELS[frame.platform]}
          </Badge>
        )}

        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
            STATUS_BADGE_CLASSES[frame.status]
          )}
        >
          {FRAME_STATUS_LABELS[frame.status]}
        </span>
      </div>

      {/* Brief preview */}
      {frame.data.brief && (
        <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
          {frame.data.brief}
        </p>
      )}
    </button>
  );
}
