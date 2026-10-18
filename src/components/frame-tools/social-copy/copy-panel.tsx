import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { validateContentLength } from "@/lib/platform-validation";
import { useGeneration } from "@/hooks/use-generation";
import { buildCopyPrompt } from "@/lib/prompt-builder/copy-prompt";
import type { PromptContext } from "@/lib/prompt-builder/context-assembler";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { toast } from "sonner";
import type { Frame } from "@/types/storyboard";
import type { ContentPlatform } from "@/types/common";
import { PLATFORM_LABELS } from "@/types/common";

// ─── Platform character limits ──────────────────────────────────

const PLATFORM_CHAR_LIMITS: Partial<Record<ContentPlatform, number>> = {
  instagram: 2200,
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  tiktok: 2200,
  youtube: 5000,
};

const SOCIAL_PLATFORMS: ContentPlatform[] = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
];

// ─── Character count bar ────────────────────────────────────────

function CharacterCountBar({
  content,
  limit,
}: {
  content: string;
  limit: number | undefined;
}) {
  if (!limit) return null;

  const validation = validateContentLength(content, limit);
  if (validation.limit === null) return null;

  const displayPercentage = Math.min(validation.percentage, 100);
  const nearLimit = validation.percentage >= 80 && !validation.isOver;

  const barColor = validation.isOver
    ? "bg-red-500"
    : nearLimit
      ? "bg-yellow-500"
      : "bg-green-500";

  const textColor = validation.isOver
    ? "text-red-400"
    : nearLimit
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Character count</span>
        <span className={textColor}>
          {validation.charCount.toLocaleString()} / {validation.limit.toLocaleString()} characters
          {validation.isOver && " (over limit)"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-300", barColor)}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

interface CopyPanelProps {
  frame: Frame;
}

export function CopyPanel({ frame }: CopyPanelProps) {
  const [platform, setPlatform] = useState<ContentPlatform>(
    frame.platform ?? "instagram"
  );
  const [variations, setVariations] = useState("3");
  const [generatedContent, setGeneratedContent] = useState(
    () => (frame.data.generatedCopy as string) ?? ""
  );
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const getActiveCampaign = useCampaignStore((s) => s.getActiveCampaign);
  const memories = useMemoryStore((s) => s.memories);
  const updateFrame = useStoryboardStore((s) => s.updateFrame);

  // Sync local state when frame changes (user selects different frame)
  useEffect(() => {
    setGeneratedContent((frame.data.generatedCopy as string) ?? "");
  }, [frame.id]);

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      setGeneratedContent(content);
      updateFrame(frame.id, {
        data: { ...frame.data, generatedCopy: content },
      });
    },
  });

  // Auto-scroll during generation
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput, isGenerating]);

  // Content to display (stream or final)
  const displayContent = isGenerating ? streamOutput : generatedContent;
  const charLimit = PLATFORM_CHAR_LIMITS[platform];

  const buildContext = useCallback((): PromptContext | null => {
    const brand = getActiveBrand();
    if (!brand) {
      toast.error("No active brand selected");
      return null;
    }
    return {
      brand,
      campaign: getActiveCampaign(),
      frame,
      memories,
      useMcp: true,
    };
  }, [getActiveBrand, getActiveCampaign, frame, memories]);

  const handleGenerate = useCallback(async () => {
    const ctx = buildContext();
    if (!ctx) return;

    setGeneratedContent("");
    clear();

    // Build a frame copy with the selected platform in case user changed it
    const frameWithPlatform: Frame = {
      ...frame,
      platform,
    };

    const prompt = buildCopyPrompt(ctx, frameWithPlatform, parseInt(variations, 10));
    await generate(prompt);
  }, [buildContext, frame, platform, variations, generate, clear]);

  const handleCopy = useCallback(() => {
    if (displayContent) {
      navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayContent]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-border px-4 py-3">
        {/* Platform and variations selectors */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Platform
            </p>
            <Select
              value={platform}
              onValueChange={(val) => setPlatform(val as ContentPlatform)}
              disabled={isGenerating}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-24 space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Variations
            </p>
            <Select
              value={variations}
              onValueChange={setVariations}
              disabled={isGenerating}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={stop}
            >
              <IconPlayerStop className="mr-1.5 h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={handleGenerate}
            >
              <IconPlayerPlay className="mr-1.5 h-3.5 w-3.5" />
              {generatedContent ? "Regenerate Copy" : "Generate Copy"}
            </Button>
          )}

          {displayContent && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <IconCheck className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <IconCopy className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Character count bar */}
        {displayContent && (
          <CharacterCountBar content={displayContent} limit={charLimit} />
        )}
      </div>

      {/* ── Output area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {displayContent ? (
          <ScrollArea className="h-full">
            <div
              ref={outputRef}
              className={cn(
                "whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-foreground/90",
                isGenerating && "animate-pulse"
              )}
            >
              {displayContent}
              {isGenerating && (
                <IconLoader2 className="ml-1 inline-block h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <IconPlayerPlay className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-[13px]">
                Pick a platform and click Generate
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Claude will create caption variations optimized for{" "}
                {PLATFORM_LABELS[platform]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
