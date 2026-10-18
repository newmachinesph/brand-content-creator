import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconCamera,
  IconVideo,
  IconPencil,
  IconPalette,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/hooks/use-generation";
import { buildBriefPrompt } from "@/lib/prompt-builder/brief-prompt";
import type { PromptContext } from "@/lib/prompt-builder/context-assembler";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { toast } from "sonner";
import type { Frame } from "@/types/storyboard";
import type { BriefType } from "@/types/common";

// ─── Brief type configuration ───────────────────────────────────

const BRIEF_TYPES: {
  value: BriefType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "photo", label: "Photo", icon: IconCamera },
  { value: "video", label: "Video", icon: IconVideo },
  { value: "copy", label: "Copy", icon: IconPencil },
  { value: "graphic", label: "Graphic", icon: IconPalette },
];

// ─── Component ──────────────────────────────────────────────────

interface BriefPanelProps {
  frame: Frame;
}

export function BriefPanel({ frame }: BriefPanelProps) {
  const [briefType, setBriefType] = useState<BriefType>("photo");
  const [generatedContent, setGeneratedContent] = useState(
    () => (frame.data.generatedBrief as string) ?? ""
  );
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const getActiveCampaign = useCampaignStore((s) => s.getActiveCampaign);
  const memories = useMemoryStore((s) => s.memories);
  const updateFrame = useStoryboardStore((s) => s.updateFrame);

  // Sync local state when frame changes (user selects different frame)
  useEffect(() => {
    setGeneratedContent((frame.data.generatedBrief as string) ?? "");
  }, [frame.id]);

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      setGeneratedContent(content);
      updateFrame(frame.id, {
        data: { ...frame.data, generatedBrief: content },
      });
    },
    onError: () => {
      // Error toast is handled by the hook
    },
  });

  // Auto-scroll during generation
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput, isGenerating]);

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
    const prompt = buildBriefPrompt(ctx, frame, briefType);
    await generate(prompt);
  }, [buildContext, frame, briefType, generate, clear]);

  const handleCopy = useCallback(() => {
    const content = generatedContent || streamOutput;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedContent, streamOutput]);

  const displayContent = isGenerating ? streamOutput : generatedContent;

  return (
    <div className="flex h-full flex-col">
      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-border px-4 py-3">
        {/* Brief type selector */}
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Brief Type
          </p>
          <div className="flex gap-1">
            {BRIEF_TYPES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={briefType === value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-1 gap-1.5",
                  briefType === value &&
                    "bg-primary text-primary-foreground"
                )}
                onClick={() => setBriefType(value)}
                disabled={isGenerating}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
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
              {generatedContent ? "Regenerate Brief" : "Generate Brief"}
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
                Select a brief type and click Generate
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Claude will create a production-ready brief for your frame
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
