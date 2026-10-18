import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconWand,
  IconPlayerStop,
  IconLoader2,
  IconCopy,
  IconCheck,
  IconUpload,
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react";
import { FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGeneration } from "@/hooks/use-generation";
import { buildDesignSpecPrompt } from "@/lib/prompt-builder/design-spec-prompt";
import {
  parseDesignSpec,
  applyDesignSpec,
  findImagePlaceholder,
  removePlaceholder,
} from "@/lib/design-spec-parser";
import type { PromptContext } from "@/lib/prompt-builder/context-assembler";
import type { DesignSpec } from "@/types/design";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useDesignStore } from "@/stores/design-store";
import { useCanvasContext } from "./canvas-context";
import { toast } from "sonner";

// ─── Component ───────────────────────────────────────────────────

export function AutoDesignPanel() {
  const [postContent, setPostContent] = useState("");
  const [designSpec, setDesignSpec] = useState<DesignSpec | null>(null);
  const [imagePromptCopied, setImagePromptCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { canvas, pushSnapshot } = useCanvasContext();
  const getActiveBrand = useBrandStore((s) => s.getActiveBrand);
  const getActiveCampaign = useCampaignStore((s) => s.getActiveCampaign);
  const memories = useMemoryStore((s) => s.memories);
  const frames = useStoryboardStore((s) => s.frames);
  const getActiveDesign = useDesignStore((s) => s.getActiveDesign);

  const setActiveDesignSpec = useDesignStore((s) => s.setActiveDesignSpec);

  const design = getActiveDesign();
  const brand = getActiveBrand();
  const linkedFrame = design?.frameId
    ? frames.find((f) => f.id === design.frameId)
    : undefined;

  // Auto-populate content from linked frame
  useEffect(() => {
    if (linkedFrame && !contentLoaded) {
      const parts: string[] = [];
      if (linkedFrame.data.generatedContent) {
        parts.push(linkedFrame.data.generatedContent);
      } else if (linkedFrame.data.brief) {
        parts.push(linkedFrame.data.brief);
      }
      if (linkedFrame.data.hashtags) {
        parts.push(`\n${linkedFrame.data.hashtags}`);
      }
      if (parts.length > 0) {
        setPostContent(parts.join("\n").trim());
        setContentLoaded(true);
      }
    }
  }, [linkedFrame, contentLoaded]);

  // Extract brand colors from brand vault sections
  const brandColors = (() => {
    if (!brand) return [];
    const colors: string[] = [];
    const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    for (const section of brand.sections) {
      if (section.kind === "document" && section.content) {
        const matches = section.content.match(hexRegex);
        if (matches) colors.push(...matches);
      } else if (section.kind === "list") {
        for (const item of section.items) {
          const matches = item.content.match(hexRegex);
          if (matches) colors.push(...matches);
          if (item.metadata) {
            for (const val of Object.values(item.metadata)) {
              const metaMatches = val.match(hexRegex);
              if (metaMatches) colors.push(...metaMatches);
            }
          }
        }
      }
    }
    // Deduplicate
    return [...new Set(colors)].slice(0, 12);
  })();

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      try {
        setParseError(null);
        const spec = parseDesignSpec(content);
        setDesignSpec(spec);
        setActiveDesignSpec(spec);

        // Auto-apply to canvas
        if (canvas) {
          applyDesignSpec(canvas, spec).then(() => {
            pushSnapshot();
            toast.success(
              spec.needsImage
                ? "Design generated — upload image to complete"
                : "Design generated"
            );
          });
        }
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse design spec"
        );
        toast.error("Failed to parse design — try regenerating");
      }
    },
  });

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
    if (!design || !postContent.trim()) {
      toast.error("Paste your content first");
      return;
    }

    const ctx = buildContext();
    if (!ctx) return;

    setDesignSpec(null);
    setParseError(null);
    clear();

    const prompt = buildDesignSpecPrompt(
      ctx,
      linkedFrame,
      { width: design.width, height: design.height },
      postContent
    );
    await generate(prompt);
  }, [buildContext, design, linkedFrame, postContent, generate, clear]);

  const handleCopyImagePrompt = useCallback(() => {
    if (designSpec?.imagePrompt) {
      navigator.clipboard.writeText(designSpec.imagePrompt);
      setImagePromptCopied(true);
      toast.success("Image prompt copied — paste into Nano Banana Pro");
      setTimeout(() => setImagePromptCopied(false), 2000);
    }
  }, [designSpec]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvas) return;

      const url = URL.createObjectURL(file);
      try {
        const img = await FabricImage.fromURL(url);

        // Find placeholder position
        const placeholder = findImagePlaceholder(canvas);
        if (placeholder) {
          // Scale image to fill placeholder area
          const imgW = img.width ?? 1;
          const imgH = img.height ?? 1;
          const scaleX = placeholder.width / imgW;
          const scaleY = placeholder.height / imgH;
          const scale = Math.max(scaleX, scaleY); // Cover the area

          img.scale(scale);
          img.set({
            left: placeholder.x,
            top: placeholder.y,
            originX: "left",
            originY: "top",
          });

          // Remove placeholder and its label
          removePlaceholder(canvas);

          // Insert image at the bottom of the stack (behind text/shapes)
          const objects = canvas.getObjects();
          canvas.add(img);
          // Move image to back so text stays on top
          canvas.sendObjectToBack(img);
          canvas.renderAll();
          pushSnapshot();
          toast.success("Image placed on canvas");
        } else {
          // No placeholder — just center the image
          const canvasW = canvas.getWidth();
          const canvasH = canvas.getHeight();
          const imgW = img.width ?? 1;
          const imgH = img.height ?? 1;
          const scale = Math.min(canvasW / imgW, canvasH / imgH) * 0.8;
          img.scale(scale);
          img.set({
            left: canvasW / 2,
            top: canvasH / 2,
            originX: "center",
            originY: "center",
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
          pushSnapshot();
          toast.success("Image added to canvas");
        }
      } catch {
        toast.error("Failed to load image");
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [canvas, pushSnapshot]
  );

  if (!design) return null;

  const hasPlaceholder = canvas ? !!findImagePlaceholder(canvas) : false;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconWand className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold">Auto Design</h3>
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3 border-b border-border px-3 py-3">
        {/* Canvas info */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-mono">
            {design.width} x {design.height}
          </Badge>
          {design.platform && (
            <Badge variant="secondary" className="text-[10px]">
              {design.platform}
            </Badge>
          )}
          {brand && (
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
              Using brand: {brand.name}
            </Badge>
          )}
        </div>

        {/* Brand color swatches */}
        {brandColors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Brand Colors
            </p>
            <div className="flex flex-wrap gap-1">
              {brandColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className="h-5 w-5 rounded border border-border/60 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    navigator.clipboard.writeText(color);
                    toast.success(`Copied ${color}`);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content input */}
        <fieldset className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">
              Post your content
            </Label>
            {linkedFrame?.data.generatedContent && !contentLoaded && (
              <Button
                variant="ghost"
                size="xs"
                className="h-5 text-[10px] text-primary"
                onClick={() => {
                  const parts: string[] = [];
                  if (linkedFrame.data.generatedContent) parts.push(linkedFrame.data.generatedContent);
                  if (linkedFrame.data.hashtags) parts.push(`\n${linkedFrame.data.hashtags}`);
                  setPostContent(parts.join("\n").trim());
                  setContentLoaded(true);
                }}
              >
                Load from frame
              </Button>
            )}
          </div>
          <Textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder={"Paste your post content here — headline, body copy, hashtags, CTA.\n\nThe AI will design the best layout using your brand's design system."}
            className="min-h-[120px] text-xs"
            rows={6}
            disabled={isGenerating}
          />
          <p className="text-[10px] text-muted-foreground/60">
            Brand design system + Google Fonts applied automatically
          </p>
        </fieldset>

        {/* Generate button */}
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
              disabled={!postContent.trim()}
            >
              <IconWand className="mr-1.5 h-3.5 w-3.5" />
              {designSpec ? "Redesign" : "Design This"}
            </Button>
          )}
        </div>
      </div>

      {/* Output / Status area */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Generating indicator */}
          {isGenerating && (
            <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 p-3">
              <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
              <div>
                <p className="text-[11px] font-medium text-foreground">
                  Generating design...
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Claude is creating your layout
                </p>
              </div>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-[11px] font-medium text-destructive">
                Parse Error
              </p>
              <p className="mt-1 text-[10px] text-destructive/80">
                {parseError}
              </p>
              <Button
                variant="outline"
                size="xs"
                className="mt-2"
                onClick={handleGenerate}
              >
                <IconRefresh className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          )}

          {/* Design spec applied successfully */}
          {designSpec && !isGenerating && (
            <>
              {/* Success message */}
              <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
                <p className="text-[11px] font-medium text-green-600">
                  Design applied to canvas
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {designSpec.textBlocks.length} text block
                  {designSpec.textBlocks.length !== 1 ? "s" : ""},&nbsp;
                  {designSpec.shapes.length} shape
                  {designSpec.shapes.length !== 1 ? "s" : ""}
                  {designSpec.needsImage ? ", 1 image placeholder" : ""}
                </p>
              </div>

              {/* Image section */}
              {designSpec.needsImage && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <IconPhoto className="h-3.5 w-3.5 text-orange-500" />
                      <p className="text-[11px] font-semibold text-foreground">
                        Image Required
                      </p>
                    </div>

                    {/* Image prompt for Nano Banana Pro */}
                    {designSpec.imagePrompt && (
                      <div className="rounded-md border border-border/50 bg-muted/10">
                        <div className="flex items-center justify-between border-b border-border/30 px-2.5 py-1.5">
                          <span className="text-[10px] font-semibold text-foreground">
                            Nano Banana Pro Prompt
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={handleCopyImagePrompt}
                            title="Copy prompt"
                          >
                            {imagePromptCopied ? (
                              <IconCheck className="h-3 w-3 text-green-400" />
                            ) : (
                              <IconCopy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="p-2.5">
                          <p className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-foreground/80">
                            {designSpec.imagePrompt}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Placeholder info */}
                    {designSpec.imagePlaceholder && (
                      <p className="text-[10px] text-muted-foreground">
                        Placeholder: {designSpec.imagePlaceholder.label} (
                        {designSpec.imagePlaceholder.width}x
                        {designSpec.imagePlaceholder.height}px)
                      </p>
                    )}

                    {/* Upload button */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        {hasPlaceholder
                          ? "Generate the image in Nano Banana Pro, then upload it here. It will replace the placeholder on the canvas."
                          : "Placeholder already replaced. Upload another image if needed."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={handleImageUpload}
                      >
                        <IconUpload className="h-3.5 w-3.5" />
                        Upload Image from Nano Banana Pro
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* No image needed */}
              {!designSpec.needsImage && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 rounded-md bg-muted/10 p-2.5">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    <p className="text-[11px] text-muted-foreground">
                      No image needed — design is complete. You can tweak
                      elements in the Properties tab.
                    </p>
                  </div>
                </>
              )}

              {/* Regenerate */}
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-muted-foreground"
                onClick={handleGenerate}
                disabled={isGenerating || !postContent.trim()}
              >
                <IconRefresh className="h-3.5 w-3.5" />
                Redesign with same content
              </Button>
            </>
          )}

          {/* Empty state */}
          {!designSpec && !isGenerating && !parseError && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <IconWand className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-[12px] text-muted-foreground">
                Paste your content and hit Design This
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Your brand's design system, Google Fonts, and atmospheric
                styling are applied automatically. Just provide the content.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}
