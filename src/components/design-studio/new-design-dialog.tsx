import { useState } from "react";
import {
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTiktok,
  IconDimensions,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDesignStore } from "@/stores/design-store";
import type { ContentPlatform } from "@/types/common";

// ─── Preset definitions ─────────────────────────────────────────

interface PlatformPreset {
  id: string;
  platform?: ContentPlatform;
  format: string;
  label: string;
  width: number;
  height: number;
  icon: Icon;
}

const PRESETS: PlatformPreset[] = [
  {
    id: "ig-post",
    platform: "instagram",
    format: "Post",
    label: "Instagram Post",
    width: 1080,
    height: 1080,
    icon: IconBrandInstagram,
  },
  {
    id: "ig-story",
    platform: "instagram",
    format: "Story",
    label: "Instagram Story",
    width: 1080,
    height: 1920,
    icon: IconBrandInstagram,
  },
  {
    id: "ig-reel",
    platform: "instagram",
    format: "Reel",
    label: "Instagram Reel",
    width: 1080,
    height: 1920,
    icon: IconBrandInstagram,
  },
  {
    id: "tw-post",
    platform: "x",
    format: "Post",
    label: "X Post",
    width: 1200,
    height: 675,
    icon: IconBrandX,
  },
  {
    id: "li-post",
    platform: "linkedin",
    format: "Post",
    label: "LinkedIn Post",
    width: 1200,
    height: 1200,
    icon: IconBrandLinkedin,
  },
  {
    id: "fb-post",
    platform: "facebook",
    format: "Post",
    label: "Facebook Post",
    width: 1200,
    height: 630,
    icon: IconBrandFacebook,
  },
  {
    id: "yt-thumb",
    platform: "youtube",
    format: "Thumbnail",
    label: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    icon: IconBrandYoutube,
  },
  {
    id: "tt-video",
    platform: "tiktok",
    format: "Video",
    label: "TikTok Video",
    width: 1080,
    height: 1920,
    icon: IconBrandTiktok,
  },
];

const CUSTOM_ID = "custom";

// ─── Aspect ratio preview ────────────────────────────────────────

function AspectPreview({ width, height }: { width: number; height: number }) {
  const maxSize = 32;
  const aspect = width / height;
  const w = aspect >= 1 ? maxSize : Math.round(maxSize * aspect);
  const h = aspect >= 1 ? Math.round(maxSize / aspect) : maxSize;

  return (
    <div
      className="border border-muted-foreground/30 bg-muted/40"
      style={{ width: `${w}px`, height: `${h}px` }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────

interface NewDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDesignDialog({ open, onOpenChange }: NewDesignDialogProps) {
  const addDesign = useDesignStore((s) => s.addDesign);

  const [name, setName] = useState("Untitled Design");
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].id);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);

  const isCustom = selectedPreset === CUSTOM_ID;
  const preset = PRESETS.find((p) => p.id === selectedPreset);

  const finalWidth = isCustom ? customWidth : (preset?.width ?? 1080);
  const finalHeight = isCustom ? customHeight : (preset?.height ?? 1080);

  function handleCreate() {
    if (!name.trim()) return;

    addDesign({
      name: name.trim(),
      width: finalWidth,
      height: finalHeight,
      platform: isCustom ? undefined : preset?.platform,
      format: isCustom ? "Custom" : preset?.format,
    });

    // Reset for next time
    setName("Untitled Design");
    setSelectedPreset(PRESETS[0].id);
    setCustomWidth(1080);
    setCustomHeight(1080);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-1.5">
            <Label htmlFor="design-name">Name</Label>
            <Input
              id="design-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled Design"
            />
          </div>

          {/* Platform presets grid */}
          <div className="space-y-1.5">
            <Label>Size Preset</Label>
            <ScrollArea className="h-[280px]">
              <div className="grid grid-cols-3 gap-2 pr-3">
                {PRESETS.map((p) => {
                  const PresetIcon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 border p-3 text-center transition-colors hover:bg-muted/30",
                        selectedPreset === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <PresetIcon className="h-4 w-4 text-muted-foreground" />
                      <AspectPreview width={p.width} height={p.height} />
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.width} x {p.height}
                      </span>
                    </button>
                  );
                })}

                {/* Custom option */}
                <button
                  type="button"
                  onClick={() => setSelectedPreset(CUSTOM_ID)}
                  className={cn(
                    "flex flex-col items-center gap-2 border p-3 text-center transition-colors hover:bg-muted/30",
                    isCustom
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  <IconDimensions className="h-4 w-4 text-muted-foreground" />
                  <AspectPreview width={customWidth} height={customHeight} />
                  <span className="text-xs font-medium text-foreground leading-tight">
                    Custom
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {customWidth} x {customHeight}
                  </span>
                </button>
              </div>
            </ScrollArea>
          </div>

          {/* Custom size inputs */}
          {isCustom && (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="custom-width">Width (px)</Label>
                <Input
                  id="custom-width"
                  type="number"
                  min={1}
                  max={4096}
                  value={customWidth}
                  onChange={(e) =>
                    setCustomWidth(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
              <span className="pb-2 text-xs text-muted-foreground">x</span>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="custom-height">Height (px)</Label>
                <Input
                  id="custom-height"
                  type="number"
                  min={1}
                  max={4096}
                  value={customHeight}
                  onChange={(e) =>
                    setCustomHeight(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
