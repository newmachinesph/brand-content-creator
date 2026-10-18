import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/hooks/use-generation";
import { buildHashtagPrompt } from "@/lib/prompt-builder/hashtag-prompt";
import type { PromptContext } from "@/lib/prompt-builder/context-assembler";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { toast } from "sonner";
import type { Frame } from "@/types/storyboard";

// ─── Tier parsing helpers ───────────────────────────────────────

interface ParsedTier {
  label: string;
  content: string;
}

/**
 * Attempts to parse the generated output into tier sections.
 * Falls back to showing the full content as a single block.
 */
function parseTiers(content: string): ParsedTier[] {
  const tiers: ParsedTier[] = [];
  const tierPattern = /###\s*(Branded\s*Hashtags?|Niche\s*Hashtags?|Broad\s*Hashtags?|Recommended\s*Combination[^]*?)/gi;
  const sections = content.split(/(?=###\s)/);

  for (const section of sections) {
    const headerMatch = section.match(/^###\s*(.+)/);
    if (headerMatch) {
      const label = headerMatch[1].trim();
      const body = section
        .replace(/^###\s*.+/, "")
        .trim();
      if (body) {
        tiers.push({ label, content: body });
      }
    }
  }

  return tiers;
}

// ─── Popularity tier scores ──────────────────────────────────────

const TIER_POPULARITY: Record<string, { score: number; label: string }> = {
  branded: { score: 3, label: "Moderate" },
  niche: { score: 4, label: "High" },
  broad: { score: 2, label: "Low" },
};

function getTierPopularity(
  tierLabel: string,
): { score: number; label: string } | null {
  const lower = tierLabel.toLowerCase();
  if (lower.includes("branded")) return TIER_POPULARITY.branded;
  if (lower.includes("niche")) return TIER_POPULARITY.niche;
  if (lower.includes("broad")) return TIER_POPULARITY.broad;
  return null;
}

function PopularityIndicator({ score, maxScore = 5 }: { score: number; maxScore?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${score}/${maxScore} popularity`}>
      {Array.from({ length: maxScore }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            i < score ? "bg-primary" : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

function PopularityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-border bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
      <span className="font-medium uppercase tracking-wider">Popularity:</span>
      {(["niche", "branded", "broad"] as const).map((key) => {
        const tier = TIER_POPULARITY[key];
        return (
          <span key={key} className="inline-flex items-center gap-1.5">
            <PopularityIndicator score={tier.score} />
            <span className="capitalize">{key}</span>
            <span>({tier.label})</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Tier copy button ───────────────────────────────────────────

function TierCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      className="shrink-0 opacity-60 hover:opacity-100"
    >
      {copied ? (
        <IconCheck className="h-3 w-3 text-green-400" />
      ) : (
        <IconCopy className="h-3 w-3" />
      )}
    </Button>
  );
}

// ─── Component ──────────────────────────────────────────────────

interface HashtagPanelProps {
  frame: Frame;
}

export function HashtagPanel({ frame }: HashtagPanelProps) {
  const [topic, setTopic] = useState(frame.title);
  const [generatedContent, setGeneratedContent] = useState(
    () => (frame.data.generatedHashtags as string) ?? ""
  );
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const getActiveCampaign = useCampaignStore((s) => s.getActiveCampaign);
  const memories = useMemoryStore((s) => s.memories);
  const updateFrame = useStoryboardStore((s) => s.updateFrame);

  // Sync local state when frame changes (user selects different frame)
  useEffect(() => {
    setGeneratedContent((frame.data.generatedHashtags as string) ?? "");
  }, [frame.id]);

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      setGeneratedContent(content);
      updateFrame(frame.id, {
        data: { ...frame.data, generatedHashtags: content },
      });
    },
  });

  // Auto-scroll during generation
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput, isGenerating]);

  // Parse tiers from generated content
  const tiers = useMemo(() => {
    if (!generatedContent) return [];
    return parseTiers(generatedContent);
  }, [generatedContent]);

  const displayContent = isGenerating ? streamOutput : generatedContent;

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
    const prompt = buildHashtagPrompt(ctx, frame, topic || undefined);
    await generate(prompt);
  }, [buildContext, frame, topic, generate, clear]);

  const handleCopyAll = useCallback(() => {
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
        {/* Topic input */}
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Topic
          </p>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic for hashtag research..."
            disabled={isGenerating}
          />
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
              {generatedContent ? "Regenerate Hashtags" : "Generate Hashtags"}
            </Button>
          )}

          {displayContent && (
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
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
            {/* During generation, show raw stream */}
            {isGenerating ? (
              <div
                ref={outputRef}
                className="animate-pulse whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-foreground/90"
              >
                {streamOutput}
                <IconLoader2 className="ml-1 inline-block h-4 w-4 animate-spin text-primary" />
              </div>
            ) : tiers.length > 0 ? (
              /* After generation, show parsed tiers with popularity */
              <div className="space-y-4 p-4">
                <PopularityLegend />
                {tiers.map((tier, idx) => {
                  const popularity = getTierPopularity(tier.label);
                  return (
                    <div
                      key={idx}
                      className="space-y-1.5 rounded-none border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tier.label}
                          </h4>
                          {popularity && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                              <PopularityIndicator score={popularity.score} />
                              {popularity.label}
                            </span>
                          )}
                        </div>
                        <TierCopyButton text={tier.content} />
                      </div>
                      <p className="text-[13px] leading-relaxed text-foreground/90">
                        {tier.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback: show raw content if parsing found no tiers */
              <div className="whitespace-pre-wrap p-4 text-[13px] font-mono leading-relaxed text-foreground/90">
                {generatedContent}
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <IconPlayerPlay className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-[13px]">
                Enter a topic and click Generate
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Claude will research hashtags organized by branded, niche, and
                broad tiers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
