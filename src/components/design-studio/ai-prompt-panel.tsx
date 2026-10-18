import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconSparkles,
  IconLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/hooks/use-generation";
import { buildImagePrompt } from "@/lib/prompt-builder/image-prompt";
import type { PromptContext } from "@/lib/prompt-builder/context-assembler";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useDesignStore } from "@/stores/design-store";
import { toast } from "sonner";

// ─── Section-level copy ──────────────────────────────────────────

const SECTION_HEADERS = [
  "## Nano Banana Pro Prompt",
  "## Short Version",
  "## Negative Prompt",
  "## Direction Notes",
];

function parseSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split("\n");

  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = SECTION_HEADERS.find((h) =>
      line.trim().startsWith(h.replace("## ", ""))
    );
    const isHeader = line.trim().startsWith("## ");

    if (isHeader || headerMatch) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          body: currentLines.join("\n").trim(),
        });
      }
      currentTitle = line.replace(/^#+\s*/, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.push({
      title: currentTitle,
      body: currentLines.join("\n").trim(),
    });
  }

  return sections;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <IconCheck className="h-3 w-3 text-green-400" />
      ) : (
        <IconCopy className="h-3 w-3" />
      )}
    </Button>
  );
}

// ─── Component ───────────────────────────────────────────────────

export function AiPromptPanel() {
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const getActiveCampaign = useCampaignStore((s) => s.getActiveCampaign);
  const memories = useMemoryStore((s) => s.memories);
  const frames = useStoryboardStore((s) => s.frames);
  const getActiveDesign = useDesignStore((s) => s.getActiveDesign);

  const design = getActiveDesign();
  const linkedFrame = design?.frameId
    ? frames.find((f) => f.id === design.frameId)
    : undefined;

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      setGeneratedContent(content);
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
      frame: linkedFrame,
      memories,
      useMcp: true,
    };
  }, [getActiveBrand, getActiveCampaign, linkedFrame, memories]);

  const handleGenerate = useCallback(async () => {
    if (!design) return;

    const ctx = buildContext();
    if (!ctx) return;

    setGeneratedContent("");
    clear();
    const prompt = buildImagePrompt(
      ctx,
      linkedFrame,
      { width: design.width, height: design.height },
      additionalContext
    );
    await generate(prompt);
  }, [buildContext, design, linkedFrame, additionalContext, generate, clear]);

  const handleCopyAll = useCallback(() => {
    const content = generatedContent || streamOutput;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("All prompts copied");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedContent, streamOutput]);

  const displayContent = isGenerating ? streamOutput : generatedContent;
  const sections = generatedContent ? parseSections(generatedContent) : [];

  if (!design) return null;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconSparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold">AI Image Prompt</h3>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-border px-3 py-3">
        {/* Linked frame info */}
        {linkedFrame && (
          <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/20 p-2">
            <IconLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground truncate">
                {linkedFrame.title}
              </p>
              {linkedFrame.data.brief && (
                <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                  {linkedFrame.data.brief}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Canvas info */}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono">
            {design.width} x {design.height}
          </Badge>
          {design.platform && (
            <Badge variant="secondary" className="text-[10px]">
              {design.platform}
            </Badge>
          )}
        </div>

        {/* Additional direction */}
        <fieldset className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            Additional direction (optional)
          </Label>
          <Textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="e.g. 'Use warm sunset tones', 'Include a person using a laptop', 'Minimalist flat illustration style'..."
            className="min-h-[60px] text-xs"
            rows={3}
            disabled={isGenerating}
          />
        </fieldset>

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
            <Button size="sm" className="flex-1" onClick={handleGenerate}>
              <IconPlayerPlay className="mr-1.5 h-3.5 w-3.5" />
              {generatedContent
                ? "Regenerate Prompts"
                : "Generate Image Prompts"}
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

      {/* ── Output area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {displayContent ? (
          <ScrollArea className="h-full">
            <div ref={outputRef} className="p-3">
              {/* While generating: raw streaming output */}
              {isGenerating && (
                <div
                  className={cn(
                    "whitespace-pre-wrap text-[12px] font-mono leading-relaxed text-foreground/90",
                    "animate-pulse"
                  )}
                >
                  {streamOutput}
                  <IconLoader2 className="ml-1 inline-block h-3.5 w-3.5 animate-spin text-primary" />
                </div>
              )}

              {/* After generation: parsed sections with copy buttons */}
              {!isGenerating && sections.length > 0 && (
                <div className="space-y-3">
                  {sections.map((section, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border/50 bg-muted/10"
                    >
                      <div className="flex items-center justify-between border-b border-border/30 px-2.5 py-1.5">
                        <span className="text-[11px] font-semibold text-foreground">
                          {section.title}
                        </span>
                        <CopyButton text={section.body} />
                      </div>
                      <div className="p-2.5">
                        <p className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-foreground/80">
                          {section.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* If no sections were parsed, show raw */}
              {!isGenerating && sections.length === 0 && generatedContent && (
                <div className="whitespace-pre-wrap text-[12px] font-mono leading-relaxed text-foreground/90">
                  {generatedContent}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center px-4">
            <div className="text-center">
              <IconSparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground">
                Generate AI image prompts
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Claude will create prompts for DALL-E, Midjourney, and Stable
                Diffusion based on your brand and canvas size
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
