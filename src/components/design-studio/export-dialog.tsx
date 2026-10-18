import { useState, useEffect, useCallback } from "react";
import { IconDownload } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanvasContext } from "./canvas-context";
import { useDesignStore } from "@/stores/design-store";

// ─── Types ───────────────────────────────────────────────────────

type ExportFormat = "png" | "jpeg" | "svg";
type ExportQuality = "60" | "70" | "80" | "90" | "100";
type ExportScale = "0.5" | "1" | "2";

const QUALITY_OPTIONS: { value: ExportQuality; label: string }[] = [
  { value: "60", label: "60% (Small)" },
  { value: "70", label: "70%" },
  { value: "80", label: "80% (Good)" },
  { value: "90", label: "90% (High)" },
  { value: "100", label: "100% (Max)" },
];

const SCALE_OPTIONS: { value: ExportScale; label: string }[] = [
  { value: "0.5", label: "0.5x (Half)" },
  { value: "1", label: "1x (Original)" },
  { value: "2", label: "2x (Retina)" },
];

// ─── Component ───────────────────────────────────────────────────

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { canvas } = useCanvasContext();
  const getActiveDesign = useDesignStore((s) => s.getActiveDesign);

  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<ExportQuality>("90");
  const [scale, setScale] = useState<ExportScale>("1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePreview = useCallback(() => {
    if (!canvas) {
      setPreviewUrl(null);
      return;
    }

    try {
      if (format === "svg") {
        // SVG preview: render a small PNG for the preview thumbnail
        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier: 1,
        });
        setPreviewUrl(dataUrl);
      } else {
        const dataUrl = canvas.toDataURL({
          format,
          quality: format === "jpeg" ? Number(quality) / 100 : undefined,
          multiplier: Number(scale),
        });
        setPreviewUrl(dataUrl);
      }
    } catch {
      setPreviewUrl(null);
    }
  }, [canvas, format, quality, scale]);

  // Regenerate preview when settings change or dialog opens
  useEffect(() => {
    if (open) {
      generatePreview();
    }
  }, [open, generatePreview]);

  function handleExport() {
    if (!canvas) return;

    const design = getActiveDesign();
    const baseName = design?.name ?? "design";
    const safeName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();

    if (format === "svg") {
      const svgString = canvas.toSVG();
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const filename = `${safeName}.svg`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      if (!previewUrl) return;

      const ext = format === "jpeg" ? "jpg" : "png";
      const filename = `${safeName}_${scale}x.${ext}`;

      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format */}
          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpeg">JPG (Lossy)</SelectItem>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality (JPG only) */}
          {format === "jpeg" && (
            <div className="space-y-1.5">
              <Label>Quality</Label>
              <Select
                value={quality}
                onValueChange={(v) => setQuality(v as ExportQuality)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scale (not applicable for SVG) */}
          {format !== "svg" && (
            <div className="space-y-1.5">
              <Label>Scale</Label>
              <Select
                value={scale}
                onValueChange={(v) => setScale(v as ExportScale)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-1.5">
            <Label>Preview</Label>
            <div className="flex items-center justify-center border border-border bg-muted/20 p-4 min-h-[160px]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="max-h-[200px] max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  No preview available
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={format === "svg" ? !canvas : !previewUrl}>
            <IconDownload className="h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
