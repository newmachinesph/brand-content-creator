import { useState, useMemo, useCallback } from "react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  IconPackageExport,
  IconFileZip,
  IconBrandGoogleDrive,
  IconCheck,
  IconCircle,
  IconClock,
  IconDownload,
  IconRocket,
  IconLoader2,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useDesignStore } from "@/stores/design-store";
import { useBrandStore } from "@/stores/brand-store";
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  FRAME_STATUS_LABELS,
} from "@/types/common";
import type { Frame } from "@/types/storyboard";
import type { Design } from "@/types/design";

// ─── Types ───────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface RecentExport {
  id: string;
  name: string;
  format: string;
  date: string;
  size: string;
}

// ─── Default Checklist ───────────────────────────────────────────

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "checked">[] = [
  {
    id: "brand-voice",
    label: "Brand voice review",
    description: "Content aligns with brand voice guidelines",
  },
  {
    id: "content-approval",
    label: "Content approval",
    description: "All content has been reviewed and approved",
  },
  {
    id: "platform-specs",
    label: "Platform specs verified",
    description: "Dimensions, formats, and limits match target platforms",
  },
  {
    id: "assets-attached",
    label: "Assets attached",
    description: "All required images, videos, and files are included",
  },
  {
    id: "hashtags-reviewed",
    label: "Hashtags reviewed",
    description: "Hashtags are relevant and within platform limits",
  },
  {
    id: "schedule-confirmed",
    label: "Schedule confirmed",
    description: "Publishing dates and times are finalized",
  },
];

// ─── Checklist Item ──────────────────────────────────────────────

function ChecklistRow({
  item,
  onToggle,
}: {
  item: ChecklistItem;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 border border-border bg-card p-3 text-left transition-colors hover:bg-muted/20",
        item.checked && "border-success/30 bg-success/5",
      )}
    >
      <div className="mt-0.5 shrink-0">
        {item.checked ? (
          <IconCheck className="h-4 w-4 text-success" />
        ) : (
          <IconCircle className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            item.checked
              ? "text-success line-through"
              : "text-foreground",
          )}
        >
          {item.label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {item.description}
        </p>
      </div>
    </button>
  );
}

// ─── ZIP helpers ────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, "_").replace(/\s+/g, "_");
}

function buildFrameText(frame: Frame, index: number): string {
  const lines: string[] = [];
  lines.push(`# Frame ${index + 1}: ${frame.title}`);
  lines.push("");
  lines.push(`- **Content Type**: ${CONTENT_TYPE_LABELS[frame.contentType] ?? frame.contentType}`);
  if (frame.platform) {
    lines.push(`- **Platform**: ${PLATFORM_LABELS[frame.platform] ?? frame.platform}`);
  }
  lines.push(`- **Status**: ${FRAME_STATUS_LABELS[frame.status] ?? frame.status}`);
  if (frame.scheduledDate) {
    lines.push(`- **Scheduled**: ${frame.scheduledDate}`);
  }
  lines.push(`- **Created**: ${frame.createdAt}`);
  lines.push(`- **Updated**: ${frame.updatedAt}`);
  lines.push("");

  if (frame.data.brief) {
    lines.push("## Brief");
    lines.push("");
    lines.push(frame.data.brief);
    lines.push("");
  }

  if (frame.data.generatedContent) {
    lines.push("## Generated Content");
    lines.push("");
    lines.push(frame.data.generatedContent);
    lines.push("");
  }

  if (frame.data.promptUsed) {
    lines.push("## Prompt Used");
    lines.push("");
    lines.push(frame.data.promptUsed);
    lines.push("");
  }

  if (frame.data.notes) {
    lines.push("## Notes");
    lines.push("");
    lines.push(frame.data.notes);
    lines.push("");
  }

  return lines.join("\n");
}

function buildDesignSummary(design: Design, index: number): string {
  const lines: string[] = [];
  lines.push(`# Design ${index + 1}: ${design.name}`);
  lines.push("");
  lines.push(`- **Dimensions**: ${design.width} x ${design.height}`);
  if (design.platform) {
    lines.push(`- **Platform**: ${PLATFORM_LABELS[design.platform] ?? design.platform}`);
  }
  if (design.format) {
    lines.push(`- **Format**: ${design.format}`);
  }
  lines.push(`- **Status**: ${design.status}`);
  lines.push(`- **Created**: ${design.createdAt}`);
  lines.push(`- **Updated**: ${design.updatedAt}`);
  if (design.frameId) {
    lines.push(`- **Linked Frame**: ${design.frameId}`);
  }
  lines.push("");
  return lines.join("\n");
}

function buildManifest(
  brandName: string,
  frames: Frame[],
  designs: Design[],
  exportDate: string,
): string {
  const lines: string[] = [];
  lines.push(`# Export Manifest`);
  lines.push("");
  lines.push(`- **Brand**: ${brandName}`);
  lines.push(`- **Export Date**: ${exportDate}`);
  lines.push(`- **Total Frames**: ${frames.length}`);
  lines.push(`- **Total Designs**: ${designs.length}`);
  lines.push("");

  if (frames.length > 0) {
    lines.push("## Frames");
    lines.push("");
    frames.forEach((frame, i) => {
      const platform = frame.platform
        ? ` (${PLATFORM_LABELS[frame.platform] ?? frame.platform})`
        : "";
      const hasContent = frame.data.generatedContent ? " [has content]" : "";
      lines.push(
        `${i + 1}. ${frame.title}${platform}${hasContent} - frames/${sanitizeFilename(frame.title)}_${frame.id.slice(0, 6)}.md`,
      );
    });
    lines.push("");
  }

  if (designs.length > 0) {
    lines.push("## Designs");
    lines.push("");
    designs.forEach((design, i) => {
      const platform = design.platform
        ? ` (${PLATFORM_LABELS[design.platform] ?? design.platform})`
        : "";
      lines.push(
        `${i + 1}. ${design.name}${platform} - designs/${sanitizeFilename(design.name)}_${design.id.slice(0, 6)}.md`,
      );
    });
    lines.push("");
  }

  return lines.join("\n");
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Main Page ───────────────────────────────────────────────────

export function ExportPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((item) => ({ ...item, checked: false })),
  );
  const [recentExports] = useState<RecentExport[]>([]);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [zipGenerating, setZipGenerating] = useState(false);

  const frames = useStoryboardStore((s) => s.frames);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const designs = useDesignStore((s) => s.designs);
  const activeBrand = useBrandStore((s) => s.getActiveBrand());

  const handleZipExport = useCallback(async () => {
    if (!activeBrand) {
      toast.error("No active brand selected. Please select a brand first.");
      return;
    }

    const brandFrames = frames.filter((f) => f.brandId === activeBrand.id);
    const brandDesigns = designs.filter((d) => d.brandId === activeBrand.id);

    if (brandFrames.length === 0 && brandDesigns.length === 0) {
      toast.error("Nothing to export. Create frames or designs first.");
      return;
    }

    setZipGenerating(true);

    try {
      const zip = new JSZip();
      const exportDate = new Date().toISOString();
      const brandName = activeBrand.name;

      // Add frame files
      if (brandFrames.length > 0) {
        const framesFolder = zip.folder("frames");
        if (framesFolder) {
          brandFrames.forEach((frame, index) => {
            const filename = `${sanitizeFilename(frame.title)}_${frame.id.slice(0, 6)}.md`;
            framesFolder.file(filename, buildFrameText(frame, index));
          });
        }
      }

      // Add design summary files
      if (brandDesigns.length > 0) {
        const designsFolder = zip.folder("designs");
        if (designsFolder) {
          brandDesigns.forEach((design, index) => {
            const filename = `${sanitizeFilename(design.name)}_${design.id.slice(0, 6)}.md`;
            designsFolder.file(filename, buildDesignSummary(design, index));
          });
        }
      }

      // Add storyboard summaries
      const brandStoryboards = storyboards.filter(
        (s) => s.brandId === activeBrand.id,
      );
      if (brandStoryboards.length > 0) {
        const sbFolder = zip.folder("storyboards");
        if (sbFolder) {
          brandStoryboards.forEach((sb) => {
            const sbLines: string[] = [];
            sbLines.push(`# ${sb.name}`);
            sbLines.push("");
            if (sb.description) {
              sbLines.push(sb.description);
              sbLines.push("");
            }
            sbLines.push(`- **Status**: ${sb.status}`);
            sbLines.push(`- **Items**: ${sb.items.length}`);
            sbLines.push(`- **Created**: ${sb.createdAt}`);
            sbLines.push(`- **Updated**: ${sb.updatedAt}`);
            sbLines.push("");

            // Include legacy items if present
            if (sb.items.length > 0) {
              sbLines.push("## Items");
              sbLines.push("");
              sb.items.forEach((item, i) => {
                sbLines.push(`### ${i + 1}. ${item.title}`);
                sbLines.push("");
                sbLines.push(`- **Type**: ${CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType}`);
                if (item.platform) {
                  sbLines.push(`- **Platform**: ${PLATFORM_LABELS[item.platform] ?? item.platform}`);
                }
                sbLines.push(`- **Status**: ${item.status}`);
                sbLines.push("");
                if (item.brief) {
                  sbLines.push("**Brief:**");
                  sbLines.push(item.brief);
                  sbLines.push("");
                }
                if (item.generatedContent) {
                  sbLines.push("**Generated Content:**");
                  sbLines.push(item.generatedContent);
                  sbLines.push("");
                }
              });
            }

            const filename = `${sanitizeFilename(sb.name)}_${sb.id.slice(0, 6)}.md`;
            sbFolder.file(filename, sbLines.join("\n"));
          });
        }
      }

      // Add manifest
      zip.file(
        "manifest.md",
        buildManifest(brandName, brandFrames, brandDesigns, exportDate),
      );

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const safeBrandName = sanitizeFilename(brandName);
      const dateStamp = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `${safeBrandName}_export_${dateStamp}.zip`);

      toast.success(
        `Exported ${brandFrames.length} frame(s) and ${brandDesigns.length} design(s) as ZIP.`,
      );
    } catch (err) {
      console.error("ZIP export failed:", err);
      toast.error("Failed to generate ZIP archive. Please try again.");
    } finally {
      setZipGenerating(false);
    }
  }, [activeBrand, frames, designs, storyboards]);

  const completedCount = useMemo(
    () => checklist.filter((i) => i.checked).length,
    [checklist],
  );
  const totalCount = checklist.length;
  const readinessPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconPackageExport className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">
              Export & Delivery
            </h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Review your export checklist and deliver content to its destination.
          </p>
        </div>

        <Separator />

        {/* Export Readiness */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Export Readiness
            </h2>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                readinessPercent === 100 ? "text-success" : "text-primary",
              )}
            >
              {readinessPercent}%
            </span>
          </div>
          <Progress
            value={readinessPercent}
            className={cn("h-2", readinessPercent === 100 && "[&_[data-slot=progress-indicator]]:bg-success")}
          />
          <p className="text-[11px] text-muted-foreground">
            {completedCount} of {totalCount} items completed
          </p>
        </div>

        <Separator />

        {/* Checklist */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Pre-Export Checklist
          </h2>
          <div className="flex flex-col gap-1.5">
            {checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Export Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Export Actions
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={handleZipExport}
              disabled={zipGenerating}
            >
              <div className="flex items-center gap-2">
                {zipGenerating ? (
                  <IconLoader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <IconFileZip className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">
                  {zipGenerating ? "Generating ZIP..." : "Export as ZIP"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground text-left">
                Download all content and assets as a ZIP archive
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => setComingSoonOpen(true)}
            >
              <div className="flex items-center gap-2">
                <IconBrandGoogleDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">
                  Export to Google Drive
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground text-left">
                Upload content directly to your Google Drive
              </span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Recent Exports */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Recent Exports
          </h2>
          {recentExports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconClock className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No exports yet. Complete the checklist and export your content.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentExports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <IconDownload className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-foreground">{exp.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {exp.format} - {exp.size}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {exp.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <IconRocket className="h-5 w-5 text-primary" />
              <DialogTitle>Coming Soon</DialogTitle>
            </div>
            <DialogDescription>
              Google Drive export is currently under development. This feature
              will allow you to upload content directly to your Google Drive.
              Stay tuned!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComingSoonOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
