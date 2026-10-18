import {
  IconPhoto,
  IconMail,
  IconArticle,
  IconSpeakerphone,
  IconBrowserCheck,
  IconVideo,
  IconDots,
  IconTrash,
  IconEdit,
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconFile,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StoryboardItem, ContentType, ItemStatus } from "@/types/storyboard";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/types/storyboard";

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

const STATUS_COLORS: Record<ItemStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-orange-500/20 text-orange-400",
  generated: "bg-blue-500/20 text-blue-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

interface StoryboardItemCardProps {
  item: StoryboardItem;
  isActive: boolean;
  isGenerating: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerate: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function StoryboardItemCard({
  item,
  isActive,
  isGenerating,
  onClick,
  onEdit,
  onDelete,
  onGenerate,
  onApprove,
  onReject,
}: StoryboardItemCardProps) {
  const Icon = CONTENT_TYPE_ICONS[item.contentType] ?? IconFile;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
        isActive
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:border-border/80 hover:bg-card/80"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {item.title}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onGenerate} disabled={isGenerating}>
              <IconPlayerPlay className="mr-2 h-4 w-4" />
              {item.generatedContent ? "Regenerate" : "Generate"}
            </DropdownMenuItem>
            {item.status === "generated" && (
              <>
                <DropdownMenuItem onClick={onApprove}>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReject}>
                  <IconX className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
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

      <p className="text-xs text-muted-foreground line-clamp-2">
        {item.brief}
      </p>

      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {CONTENT_TYPE_LABELS[item.contentType]}
        </Badge>
        {item.platform && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {PLATFORM_LABELS[item.platform]}
          </Badge>
        )}
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
            STATUS_COLORS[item.status]
          )}
        >
          {item.status === "generating" ? "Generating…" : item.status}
        </span>
      </div>
    </button>
  );
}
