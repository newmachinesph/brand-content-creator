import { useMemo } from "react";
import {
  IconTrash,
  IconBrush,
  IconPlus,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDesignStore } from "@/stores/design-store";
import { PLATFORM_LABELS } from "@/types/common";

// ─── Constants ──────────────────────────────────────────────────

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-chart-4" },
  review: { label: "Review", color: "bg-chart-3" },
  approved: { label: "Approved", color: "bg-primary" },
  exported: { label: "Exported", color: "bg-chart-5" },
};

const PLATFORM_CONFIG: Record<string, { label: string; icon: Icon; color: string }> = {
  instagram: { label: "Instagram", icon: IconBrandInstagram, color: "#E1306C" },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#69C9D0" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

// ─── Helpers ────────────────────────────────────────────────────

function dimensionLabel(width: number, height: number): string {
  return `${width}x${height}`;
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 65%)`;
}

// ─── Design Card ────────────────────────────────────────────────

function DesignCard({
  design,
  isActive,
  onSelect,
  onDelete,
}: {
  design: {
    id: string;
    name: string;
    width: number;
    height: number;
    platform?: string;
    thumbnail?: string;
  };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const aspect = design.width / design.height;
  const previewMaxW = 64;
  const previewMaxH = 48;
  const pw = aspect >= 1 ? previewMaxW : Math.round(previewMaxH * aspect);
  const ph = aspect >= 1 ? Math.round(previewMaxW / aspect) : previewMaxH;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 w-full border px-3 py-2.5 text-left transition-colors hover:bg-muted/30",
        isActive ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex h-12 w-16 shrink-0 items-center justify-center bg-muted/20">
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt={design.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div
            style={{
              width: `${pw}px`,
              height: `${ph}px`,
              backgroundColor: hashColor(design.id),
            }}
            className="opacity-60"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">
            {design.name}
          </p>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">
            {dimensionLabel(design.width, design.height)}
          </Badge>
        </div>
        {design.platform && (
          <Badge variant="outline" className="text-[10px] px-1.5 w-fit">
            {PLATFORM_LABELS[design.platform as keyof typeof PLATFORM_LABELS] ??
              design.platform}
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 rounded"
        aria-label={`Delete ${design.name}`}
      >
        <IconTrash className="h-3.5 w-3.5 text-destructive" />
      </button>
    </button>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────

export function DesignSidebar() {
  const designs = useDesignStore((s) => s.designs);
  const activeDesignId = useDesignStore((s) => s.activeDesignId);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);
  const removeDesign = useDesignStore((s) => s.removeDesign);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    for (const d of designs) {
      byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
      if (d.platform) {
        byPlatform[d.platform] = (byPlatform[d.platform] ?? 0) + 1;
      }
    }

    return { byStatus, byPlatform };
  }, [designs]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Summary */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Studio
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {designs.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              designs
            </span>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Status */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Status
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(STATUS_INFO).map(([key, info]) => {
              const count = stats.byStatus[key] ?? 0;
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", info.color)} />
                  <span className="flex-1 text-sidebar-foreground/70">{info.label}</span>
                  <span className="text-[12px] font-medium tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
            {Object.keys(stats.byStatus).length === 0 && (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                No designs yet.
              </p>
            )}
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Platform */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Platform
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const count = stats.byPlatform[key] ?? 0;
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
            {Object.keys(stats.byPlatform).length === 0 && (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                No platform-specific designs.
              </p>
            )}
          </div>
        </div>

        {/* Design List */}
        {designs.length > 0 && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Designs
              </p>
              <div className="flex flex-col gap-1">
                {designs.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    isActive={design.id === activeDesignId}
                    onSelect={() => setActiveDesign(design.id)}
                    onDelete={() => removeDesign(design.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 space-y-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("design-create-trigger"));
          }}
        >
          <IconPlus className="h-4 w-4" />
          New Design
        </Button>
      </div>
    </div>
  );
}
