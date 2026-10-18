import { useEffect, useRef, useCallback } from "react";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCopy,
  IconCheck,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useBrandStore } from "@/stores/brand-store";
import { spawnClaude } from "@/lib/claude";
import { buildContentPrompt } from "@/lib/prompt-builder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StoryboardItem } from "@/types/storyboard";
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/types/storyboard";
import type { ClaudeChild } from "@/lib/claude";
import { useState } from "react";

interface GenerationPanelProps {
  item: StoryboardItem;
}

export function GenerationPanel({ item }: GenerationPanelProps) {
  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const generatingItemId = useStoryboardStore((s) => s.generatingItemId);
  const streamOutput = useStoryboardStore((s) => s.streamOutput);
  const setGeneratingItem = useStoryboardStore((s) => s.setGeneratingItem);
  const appendStreamOutput = useStoryboardStore((s) => s.appendStreamOutput);
  const clearStreamOutput = useStoryboardStore((s) => s.clearStreamOutput);
  const saveGeneratedContent = useStoryboardStore(
    (s) => s.saveGeneratedContent
  );
  const updateItemStatus = useStoryboardStore((s) => s.updateItemStatus);

  const [copied, setCopied] = useState(false);
  const childRef = useRef<ClaudeChild | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const accumulatedRef = useRef("");

  const isGenerating = generatingItemId === item.id;
  const displayContent = isGenerating ? streamOutput : item.generatedContent;

  // Auto-scroll during generation
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamOutput, isGenerating]);

  const handleGenerate = useCallback(async () => {
    const brand = getActiveBrand();
    if (!brand) {
      toast.error("No active brand selected");
      return;
    }

    const prompt = buildContentPrompt(brand, item);

    clearStreamOutput();
    setGeneratingItem(item.id);
    updateItemStatus(item.id, "generating");
    accumulatedRef.current = "";

    try {
      const child = await spawnClaude(prompt, (event) => {
        if (event.type === "stdout") {
          accumulatedRef.current += event.content;
          appendStreamOutput(event.content);
        } else if (event.type === "stderr") {
          console.warn("[claude stderr]", event.content);
        } else if (event.type === "close") {
          const finalContent = accumulatedRef.current.trim();
          if (event.exitCode === 0 && finalContent) {
            saveGeneratedContent(item.id, finalContent, prompt);
            toast.success("Content generated");
          } else if (event.exitCode !== 0) {
            updateItemStatus(item.id, "draft");
            toast.error(`Claude exited with code ${event.exitCode}`);
          }
          setGeneratingItem(null);
          childRef.current = null;
        } else if (event.type === "error") {
          updateItemStatus(item.id, "draft");
          toast.error(`Error: ${event.content}`);
          setGeneratingItem(null);
          childRef.current = null;
        }
      });
      childRef.current = child;
    } catch (err) {
      console.error("Failed to spawn Claude:", err);
      updateItemStatus(item.id, "draft");
      setGeneratingItem(null);
      toast.error("Failed to start Claude CLI. Is it installed?");
    }
  }, [
    item,
    getActiveBrand,
    clearStreamOutput,
    setGeneratingItem,
    updateItemStatus,
    appendStreamOutput,
    saveGeneratedContent,
  ]);

  const handleStop = useCallback(async () => {
    if (childRef.current) {
      await childRef.current.kill();
      childRef.current = null;
      setGeneratingItem(null);
      updateItemStatus(item.id, "draft");
      toast("Generation stopped");
    }
  }, [item.id, setGeneratingItem, updateItemStatus]);

  function handleCopy() {
    if (displayContent) {
      navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Item info header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {item.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px]">
              {CONTENT_TYPE_LABELS[item.contentType]}
            </Badge>
            {item.platform && (
              <Badge variant="outline" className="text-[10px]">
                {PLATFORM_LABELS[item.platform]}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">
              {STATUS_LABELS[item.status]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {displayContent && (
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <IconCheck className="h-4 w-4 text-green-400" />
              ) : (
                <IconCopy className="h-4 w-4" />
              )}
            </Button>
          )}
          {isGenerating ? (
            <Button variant="destructive" size="sm" onClick={handleStop}>
              <IconPlayerStop className="mr-1.5 h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={handleGenerate}>
              <IconPlayerPlay className="mr-1.5 h-4 w-4" />
              {item.generatedContent ? "Regenerate" : "Generate"}
            </Button>
          )}
        </div>
      </div>

      {/* Brief */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">Brief</p>
        <p className="text-sm text-foreground/80">{item.brief}</p>
      </div>

      {/* Generated content / stream output */}
      <div className="flex-1 overflow-hidden">
        {displayContent ? (
          <ScrollArea className="h-full">
            <div
              ref={outputRef}
              className={cn(
                "whitespace-pre-wrap p-4 text-sm font-mono leading-relaxed text-foreground/90",
                isGenerating && "animate-pulse"
              )}
            >
              {displayContent}
              {isGenerating && (
                <IconLoader2 className="inline-block ml-1 h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <IconPlayerPlay className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">
                Click Generate to create content with Claude
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Approve / Reject footer for generated content */}
      {item.status === "generated" && !isGenerating && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateItemStatus(item.id, "rejected")}
          >
            <IconX className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => updateItemStatus(item.id, "approved")}
            className="bg-green-600 hover:bg-green-700"
          >
            <IconCheck className="mr-1.5 h-4 w-4" />
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
