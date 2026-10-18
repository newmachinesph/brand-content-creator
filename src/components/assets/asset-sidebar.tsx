import { useMemo } from "react";
import {
  IconPhoto,
  IconVideo,
  IconFileText,
  IconUpload,
  IconLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAssetStore } from "@/stores/asset-store";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────

function fileTypeCategory(fileType: string): "image" | "video" | "document" {
  if (
    fileType.startsWith("image") ||
    ["jpg", "png", "gif", "webp", "svg"].includes(fileType)
  )
    return "image";
  if (
    fileType.startsWith("video") ||
    ["mp4", "mov", "avi", "mkv"].includes(fileType)
  )
    return "video";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

// ─── Component ──────────────────────────────────────────────────

interface AssetSidebarProps {
  onUpload: () => void;
}

export function AssetSidebar({ onUpload }: AssetSidebarProps) {
  const assets = useAssetStore((s) => s.assets);

  const stats = useMemo(() => {
    let images = 0;
    let videos = 0;
    let documents = 0;
    let linked = 0;
    let totalSize = 0;

    for (const a of assets) {
      const cat = fileTypeCategory(a.fileType);
      if (cat === "image") images++;
      else if (cat === "video") videos++;
      else documents++;
      if (a.frameId) linked++;
      totalSize += a.fileSize;
    }

    return { images, videos, documents, linked, unlinked: assets.length - linked, totalSize };
  }, [assets]);

  const TYPE_ROWS = [
    { label: "Images", count: stats.images, icon: IconPhoto, color: "text-blue-400" },
    { label: "Videos", count: stats.videos, icon: IconVideo, color: "text-purple-400" },
    { label: "Documents", count: stats.documents, icon: IconFileText, color: "text-orange-400" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Total stats */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Library
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {assets.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatSize(stats.totalSize)} total
            </span>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By type */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Type
          </p>
          <div className="flex flex-col gap-1">
            {TYPE_ROWS.map(({ label, count, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
              >
                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                <span className="flex-1 text-sidebar-foreground/70">{label}</span>
                <span className="text-[12px] font-medium tabular-nums text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Link status */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Usage
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconLink className="h-4 w-4 shrink-0 text-green-400" />
              <span className="flex-1 text-sidebar-foreground/70">Linked to frames</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.linked}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
              <IconPhoto className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <span className="flex-1 text-sidebar-foreground/70">Unlinked</span>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {stats.unlinked}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload button */}
      <div className="shrink-0 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onUpload}
        >
          <IconUpload className="h-4 w-4" />
          Upload Asset
        </Button>
      </div>
    </div>
  );
}
