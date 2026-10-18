import { useState, useMemo } from "react";
import {
  IconPhoto,
  IconMail,
  IconArticle,
  IconSpeakerphone,
  IconBrowserCheck,
  IconVideo,
  IconFile,
  IconEye,
  IconFileDescription,
  IconCopy,
  IconHash,
  IconPaperclip,
  IconPuzzle,
  IconUpload,
  IconTrash,
  IconBrush,
  IconCalendar,
  IconArrowRight,
  IconLink,
  IconLinkOff,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BriefPanel } from "@/components/frame-tools/brief-generator/brief-panel";
import { CopyPanel } from "@/components/frame-tools/social-copy/copy-panel";
import { HashtagPanel } from "@/components/frame-tools/hashtag-research/hashtag-panel";
import { useAssetStore } from "@/stores/asset-store";
import { useDesignStore } from "@/stores/design-store";
import { useAppStore } from "@/stores/app-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useCalendarStore } from "@/stores/calendar-store";
import type { Frame } from "@/types/storyboard";
import type { ContentType, FrameStatus } from "@/types/common";
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

// ─── Tab definitions ───────────────────────────────────────────

const TABS = [
  { value: "overview", label: "Overview", icon: IconEye },
  { value: "brief", label: "Brief", icon: IconFileDescription },
  { value: "copy", label: "Copy", icon: IconCopy },
  { value: "hashtags", label: "Hashtags", icon: IconHash },
  { value: "assets", label: "Assets", icon: IconPaperclip },
  { value: "assembly", label: "Assembly", icon: IconPuzzle },
] as const;

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(date: string | undefined): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

// ─── Assets Tab Content ────────────────────────────────────────

function AssetsTabContent({ frame }: { frame: Frame }) {
  const allAssets = useAssetStore((s) => s.assets);
  const addAsset = useAssetStore((s) => s.addAsset);
  const updateAsset = useAssetStore((s) => s.updateAsset);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const [showLibrary, setShowLibrary] = useState(false);

  const frameAssets = useMemo(
    () => allAssets.filter((a) => a.frameId === frame.id),
    [allAssets, frame.id],
  );

  // Assets available to attach (not linked to any frame)
  const libraryAssets = useMemo(
    () => allAssets.filter((a) => !a.frameId),
    [allAssets],
  );

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*,.pdf,.doc,.docx";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);
        addAsset({
          fileName: file.name,
          fileUrl: url,
          fileType: file.type || file.name.split(".").pop() || "unknown",
          fileSize: file.size,
          frameId: frame.id,
          tags: [],
        });
      }
    };
    input.click();
  };

  const handleAttach = (assetId: string) => {
    updateAsset(assetId, { frameId: frame.id });
  };

  const handleUnlink = (assetId: string) => {
    updateAsset(assetId, { frameId: undefined });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Frame Assets ({frameAssets.length})
        </h3>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}>
            <IconLink className="h-3.5 w-3.5" />
            {showLibrary ? "Hide Library" : "From Library"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleUpload}>
            <IconUpload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Library picker — attach existing assets */}
      {showLibrary && (
        <div className="space-y-2 border border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-[11px] font-medium text-primary">
            Attach from Asset Library ({libraryAssets.length} available)
          </p>
          {libraryAssets.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No unlinked assets. Upload assets in the Asset Manager first.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {libraryAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAttach(asset.id)}
                  className="flex items-center gap-2 border border-border bg-card p-2 text-left transition-colors hover:bg-muted/30"
                >
                  <IconFile className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 min-w-0 text-[11px] text-foreground truncate">
                    {asset.fileName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatSize(asset.fileSize)}
                  </span>
                  <IconLink className="h-3 w-3 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {frameAssets.length === 0 && !showLibrary ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border bg-muted/10 p-8 text-center">
          <IconPaperclip className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-xs font-medium text-foreground">
              No assets attached
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Upload new assets or attach existing ones from your library.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLibrary(true)}>
              <IconLink className="h-3.5 w-3.5" />
              From Library
            </Button>
            <Button variant="outline" size="sm" onClick={handleUpload}>
              <IconUpload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {frameAssets.map((asset) => (
            <div
              key={asset.id}
              className="group flex items-center gap-3 border border-border bg-card p-2.5 transition-colors hover:bg-muted/20"
            >
              <IconFile className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {asset.fileName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatSize(asset.fileSize)}
                  {asset.width &&
                    asset.height &&
                    ` · ${asset.width}x${asset.height}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(asset.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                title="Unlink from frame"
              >
                <IconLinkOff className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                title="Delete asset"
              >
                <IconTrash className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Assembly Tab Content ──────────────────────────────────────

function AssemblyTabContent({ frame }: { frame: Frame }) {
  const allAssets = useAssetStore((s) => s.assets);
  const addDesign = useDesignStore((s) => s.addDesign);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const frameAssets = allAssets.filter((a) => a.frameId === frame.id);
  const hasAssets = frameAssets.length > 0;

  const handleCreateDesign = async () => {
    const width = 1080;
    const height = 1080;
    await addDesign({
      name: `${frame.title} — Design`,
      width,
      height,
      frameId: frame.id,
      platform: frame.platform ?? undefined,
    });
    setActiveModule("design-studio");
  };

  const checklistItems = [
    { label: "Brief written", done: !!frame.data.brief },
    { label: "Content generated", done: !!frame.data.generatedContent },
    { label: "Platform assigned", done: !!frame.platform },
    { label: "Assets attached", done: hasAssets },
    {
      label: "Status: Approved",
      done: frame.status === "approved" || frame.status === "published",
    },
  ];

  const completedCount = checklistItems.filter((i) => i.done).length;
  const readinessPercent = Math.round(
    (completedCount / checklistItems.length) * 100,
  );

  return (
    <div className="p-4 space-y-6 mx-auto max-w-lg">
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Assembly Readiness
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                readinessPercent === 100 ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              readinessPercent === 100 ? "text-green-500" : "text-primary",
            )}
          >
            {readinessPercent}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {checklistItems.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 border border-border p-3 transition-colors",
              item.done ? "bg-green-500/5 border-green-500/30" : "bg-card",
            )}
          >
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                item.done
                  ? "border-green-500 bg-green-500"
                  : "border-muted-foreground/40",
              )}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={cn(
                "text-xs",
                item.done ? "text-green-500 line-through" : "text-foreground",
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <Separator />
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Create Graphic
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleCreateDesign}
        >
          <IconBrush className="h-3.5 w-3.5" />
          Create Design in Studio
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Opens Design Studio with this frame linked for AI prompt context.
        </p>
      </div>

      {frame.platform && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Platform Preview
            </h3>
            <div className="border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px]">
                  {PLATFORM_LABELS[frame.platform]}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  {CONTENT_TYPE_LABELS[frame.contentType]}
                </Badge>
              </div>

              {frame.data.generatedContent ? (
                <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground/80 font-mono max-h-48 overflow-y-auto">
                  {String(frame.data.generatedContent).slice(0, 500)}
                  {String(frame.data.generatedContent).length > 500 && "..."}
                </pre>
              ) : (
                <p className="text-[12px] text-muted-foreground italic">
                  No content generated yet.
                </p>
              )}

              {hasAssets && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <IconPaperclip className="h-3 w-3" />
                  {frameAssets.length} asset
                  {frameAssets.length !== 1 && "s"} attached
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────

interface FrameDetailProps {
  frame: Frame;
}

export function FrameDetail({ frame }: FrameDetailProps) {
  const [notes, setNotes] = useState(frame.data.notes ?? "");
  const ContentIcon = CONTENT_TYPE_ICONS[frame.contentType];
  const campaigns = useCampaignStore((s) => s.campaigns);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const calendarEvents = useCalendarStore((s) => s.events);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  const parentCampaign = frame.campaignId
    ? campaigns.find((c) => c.id === frame.campaignId)
    : undefined;

  const linkedEvents = useMemo(
    () =>
      calendarEvents
        .filter((e) => e.frameId === frame.id)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [calendarEvents, frame.id],
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <ContentIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {frame.title}
        </h2>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
            {CONTENT_TYPE_LABELS[frame.contentType]}
          </Badge>

          {frame.platform && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {PLATFORM_LABELS[frame.platform]}
            </Badge>
          )}

          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
              STATUS_BADGE_CLASSES[frame.status],
            )}
          >
            {FRAME_STATUS_LABELS[frame.status]}
          </span>
        </div>
      </div>

      {/* ── Tab system ─────────────────────────────────────── */}
      <Tabs
        defaultValue="overview"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList
          className="w-full justify-start border-b border-border px-4"
          variant="line"
        >
          {TABS.map(({ value, label, icon: TabIcon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <TabIcon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview tab ──────────────────────────────────── */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <p className="text-[13px] text-foreground">
                    {FRAME_STATUS_LABELS[frame.status]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Content Type
                  </p>
                  <p className="text-[13px] text-foreground">
                    {CONTENT_TYPE_LABELS[frame.contentType]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Platform
                  </p>
                  <p className="text-[13px] text-foreground">
                    {frame.platform
                      ? PLATFORM_LABELS[frame.platform]
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Scheduled Date
                  </p>
                  <p className="text-[13px] text-foreground">
                    {formatDate(frame.scheduledDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Created
                  </p>
                  <p className="text-[13px] text-foreground">
                    {new Date(frame.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Updated
                  </p>
                  <p className="text-[13px] text-foreground">
                    {new Date(frame.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Context links (campaign + calendar) ─────── */}
            {(parentCampaign || linkedEvents.length > 0) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                    Context
                  </h3>

                  {parentCampaign && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCampaign(parentCampaign.id);
                        setActiveModule("campaigns");
                      }}
                      className="group flex w-full items-center gap-2 border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/30"
                    >
                      <IconSpeakerphone className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                        {parentCampaign.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Campaign</span>
                      <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  )}

                  {linkedEvents.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {linkedEvents.slice(0, 3).map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => {
                            setSelectedDate(evt.scheduledAt.slice(0, 10));
                            setActiveModule("calendar");
                          }}
                          className="group flex w-full items-center gap-2 border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/30"
                        >
                          <IconCalendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                            {evt.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(evt.scheduledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* ── Side-by-side Brief / Generated Content ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Brief */}
              <div className="space-y-2 border border-border bg-muted/20 p-3">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                  Brief
                </h3>
                {frame.data.brief ? (
                  <p className="text-[13px] leading-relaxed text-foreground">
                    {frame.data.brief}
                  </p>
                ) : (
                  <p className="text-[13px] italic text-muted-foreground">
                    No brief has been written for this frame yet.
                  </p>
                )}
              </div>

              {/* Right: Generated Content */}
              <div className="space-y-2 border border-border bg-muted/20 p-3">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                  Generated Content
                </h3>
                {frame.data.generatedContent ? (
                  <pre className="whitespace-pre-wrap rounded-none border border-border bg-muted/50 p-3 font-mono text-[13px] leading-relaxed text-foreground">
                    {frame.data.generatedContent}
                  </pre>
                ) : (
                  <p className="text-[13px] italic text-muted-foreground">
                    No content generated yet — use AI tools to generate
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                Notes
              </h3>
              <Textarea
                placeholder="Add notes about this frame..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Brief tab ────────────────────────────────────── */}
        <TabsContent value="brief" className="flex-1 overflow-hidden">
          <BriefPanel frame={frame} />
        </TabsContent>

        {/* ── Copy tab ─────────────────────────────────────── */}
        <TabsContent value="copy" className="flex-1 overflow-hidden">
          <CopyPanel frame={frame} />
        </TabsContent>

        {/* ── Hashtags tab ─────────────────────────────────── */}
        <TabsContent value="hashtags" className="flex-1 overflow-hidden">
          <HashtagPanel frame={frame} />
        </TabsContent>

        {/* ── Assets tab ──────────────────────────────────── */}
        <TabsContent value="assets" className="flex-1 overflow-y-auto">
          <AssetsTabContent frame={frame} />
        </TabsContent>

        {/* ── Assembly tab ─────────────────────────────────── */}
        <TabsContent value="assembly" className="flex-1 overflow-y-auto">
          <AssemblyTabContent frame={frame} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
