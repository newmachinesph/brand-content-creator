import { useState, useRef, useCallback } from "react";
import {
  IconPhoto,
  IconUpload,
  IconCopy,
  IconCheck,
  IconWand,
} from "@tabler/icons-react";
import { FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDesignStore } from "@/stores/design-store";
import { useCanvasContext } from "./canvas-context";
import { findImagePlaceholder, removePlaceholder } from "@/lib/design-spec-parser";
import { toast } from "sonner";

export function AssetRequestsPanel() {
  const designSpec = useDesignStore((s) => s.activeDesignSpec);
  const getActiveDesign = useDesignStore((s) => s.getActiveDesign);
  const design = getActiveDesign();
  const { canvas, pushSnapshot } = useCanvasContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  const hasPlaceholder = canvas ? !!findImagePlaceholder(canvas) : false;

  const handleCopyPrompt = useCallback(() => {
    if (designSpec?.imagePrompt) {
      navigator.clipboard.writeText(designSpec.imagePrompt);
      setPromptCopied(true);
      toast.success("Image prompt copied to clipboard");
      setTimeout(() => setPromptCopied(false), 2000);
    }
  }, [designSpec]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvas) return;

      const url = URL.createObjectURL(file);
      try {
        const img = await FabricImage.fromURL(url);
        const placeholder = findImagePlaceholder(canvas);

        if (placeholder) {
          const imgW = img.width ?? 1;
          const imgH = img.height ?? 1;
          const scale = Math.max(
            placeholder.width / imgW,
            placeholder.height / imgH
          );
          img.scale(scale);
          img.set({
            left: placeholder.x,
            top: placeholder.y,
            originX: "left",
            originY: "top",
          });
          removePlaceholder(canvas);
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
          pushSnapshot();
          toast.success("Image placed on canvas");
        } else {
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

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [canvas, pushSnapshot]
  );

  if (!design) return null;

  // No design spec generated yet
  if (!designSpec) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <IconWand className="h-8 w-8 text-muted-foreground/30" />
        <div>
          <p className="text-[12px] font-medium text-foreground">
            No design generated yet
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Go to the Auto tab and generate a design first. Any required assets
            will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Design doesn't need images
  if (!designSpec.needsImage) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-1.5">
            <IconPhoto className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold">Asset Requests</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <IconCheck className="h-8 w-8 text-green-500/60" />
          <div>
            <p className="text-[12px] font-medium text-foreground">
              No assets required
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Your design is complete — no images needed. Edit elements in the
              Props tab or export.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Design needs images — show the request
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconPhoto className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold">Asset Requests</h3>
          <Badge
            variant="destructive"
            className="ml-auto text-[9px] px-1.5 py-0"
          >
            {hasPlaceholder ? "Pending" : "Done"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Image request card */}
          <div className="rounded-md border border-orange-500/30 bg-orange-500/5 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <IconPhoto className="h-3.5 w-3.5 text-orange-500" />
              <p className="text-[11px] font-semibold text-foreground">
                Image Required
              </p>
            </div>

            {designSpec.imagePlaceholder && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-mono">
                  {designSpec.imagePlaceholder.width} x{" "}
                  {designSpec.imagePlaceholder.height}px
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {designSpec.imagePlaceholder.label}
                </span>
              </div>
            )}

            {/* Image prompt */}
            {designSpec.imagePrompt && (
              <>
                <Separator />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">
                    Image Description / AI Prompt
                  </p>
                  <div className="rounded-md border border-border/50 bg-background p-2.5">
                    <p className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-foreground/80">
                      {designSpec.imagePrompt}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full gap-1.5"
                    onClick={handleCopyPrompt}
                  >
                    {promptCopied ? (
                      <IconCheck className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <IconCopy className="h-3.5 w-3.5" />
                    )}
                    {promptCopied ? "Copied!" : "Copy Prompt"}
                  </Button>
                </div>
              </>
            )}

            <Separator />

            {/* Upload section */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground">
                {hasPlaceholder
                  ? "Generate the image using the prompt above, then upload it here to replace the placeholder."
                  : "Image uploaded. Upload another to replace it."}
              </p>
              <Button
                variant={hasPlaceholder ? "default" : "outline"}
                size="sm"
                className="w-full gap-1.5"
                onClick={handleUpload}
              >
                <IconUpload className="h-3.5 w-3.5" />
                {hasPlaceholder ? "Upload Image" : "Replace Image"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

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
