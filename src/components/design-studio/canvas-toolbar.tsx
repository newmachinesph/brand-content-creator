import { useRef, useCallback } from "react";
import {
  IconH1,
  IconH2,
  IconTypography,
  IconSquare,
  IconCircle,
  IconMinus,
  IconPhoto,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
} from "@tabler/icons-react";
import { FabricText, FabricImage, Rect, Circle, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCanvasContext, ZOOM_PRESETS } from "./canvas-context";
import { loadGoogleFont } from "@/lib/google-fonts";

// ---- helpers ---------------------------------------------------------------

function getCanvasCenter(canvas: { getWidth: () => number; getHeight: () => number }) {
  return {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
  };
}

// ---- component -------------------------------------------------------------

export function CanvasToolbar() {
  const { canvas, zoom, setZoom, fitToScreen, undo, redo, canUndo, canRedo, pushSnapshot } =
    useCanvasContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- text tools ----------------------------------------------------------

  const addText = useCallback(
    async (
      text: string,
      fontSize: number,
      fontWeight: string,
      fontFamily: string,
      charSpacing?: number,
    ) => {
      if (!canvas) return;
      await loadGoogleFont(fontFamily);
      const center = getCanvasCenter(canvas);
      const textObj = new FabricText(text, {
        fontSize,
        fontWeight,
        fontFamily,
        fill: "#ffffff",
        left: center.left,
        top: center.top,
        originX: "center",
        originY: "center",
        charSpacing: charSpacing ?? 0,
      });
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();
      pushSnapshot();
    },
    [canvas, pushSnapshot],
  );

  // ---- shape tools ---------------------------------------------------------

  const addRect = useCallback(() => {
    if (!canvas) return;
    const center = getCanvasCenter(canvas);
    const rect = new Rect({
      width: 200,
      height: 150,
      fill: "#6366F1",
      stroke: undefined,
      strokeWidth: 0,
      left: center.left,
      top: center.top,
      originX: "center",
      originY: "center",
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    pushSnapshot();
  }, [canvas, pushSnapshot]);

  const addCircle = useCallback(() => {
    if (!canvas) return;
    const center = getCanvasCenter(canvas);
    const circle = new Circle({
      radius: 75,
      fill: "#22D3EE",
      stroke: undefined,
      strokeWidth: 0,
      left: center.left,
      top: center.top,
      originX: "center",
      originY: "center",
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    pushSnapshot();
  }, [canvas, pushSnapshot]);

  const addLine = useCallback(() => {
    if (!canvas) return;
    const center = getCanvasCenter(canvas);
    const line = new Line([0, 0, 200, 0], {
      stroke: "#ffffff",
      strokeWidth: 2,
      left: center.left - 100,
      top: center.top,
      originX: "left",
      originY: "center",
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    pushSnapshot();
  }, [canvas, pushSnapshot]);

  // ---- image upload --------------------------------------------------------

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas || !e.target.files?.length) return;

      const file = e.target.files[0];
      const blobUrl = URL.createObjectURL(file);

      try {
        const img = await FabricImage.fromURL(blobUrl);

        // Scale to fit within canvas if larger
        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const imgW = img.width ?? 1;
        const imgH = img.height ?? 1;

        if (imgW > canvasW || imgH > canvasH) {
          const scale = Math.min(canvasW / imgW, canvasH / imgH) * 0.8;
          img.scale(scale);
        }

        const center = getCanvasCenter(canvas);
        img.set({
          left: center.left,
          top: center.top,
          originX: "center",
          originY: "center",
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        pushSnapshot();
      } finally {
        URL.revokeObjectURL(blobUrl);
      }

      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [canvas, pushSnapshot],
  );

  // ---- zoom ----------------------------------------------------------------

  const handleZoomIn = useCallback(() => {
    const next = Math.min(zoom + 0.1, 5);
    setZoom(Math.round(next * 100) / 100);
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(zoom - 0.1, 0.1);
    setZoom(Math.round(next * 100) / 100);
  }, [zoom, setZoom]);

  const handleFitToScreen = useCallback(() => {
    const container = document.querySelector(
      "[data-canvas-viewport]"
    );
    if (container && canvas) {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const canvasW = canvas.getWidth() / zoom;
      const canvasH = canvas.getHeight() / zoom;
      fitToScreen(containerW, containerH, canvasW, canvasH);
    }
  }, [canvas, zoom, fitToScreen]);

  // ---- render --------------------------------------------------------------

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-background px-2 py-1">
      {/* Text tools */}
      <ToolbarButton label="Heading (Anton)" onClick={() => addText("HEADING", 48, "bold", "Anton", 50)}>
        <IconH1 />
      </ToolbarButton>
      <ToolbarButton label="Subheading (DM Sans)" onClick={() => addText("Subheading", 28, "500", "DM Sans")}>
        <IconH2 />
      </ToolbarButton>
      <ToolbarButton label="Body text (Inter)" onClick={() => addText("Body text", 16, "normal", "Inter")}>
        <IconTypography />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Shape tools */}
      <ToolbarButton label="Rectangle" onClick={addRect}>
        <IconSquare />
      </ToolbarButton>
      <ToolbarButton label="Circle" onClick={addCircle}>
        <IconCircle />
      </ToolbarButton>
      <ToolbarButton label="Line" onClick={addLine}>
        <IconMinus />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Image upload */}
      <ToolbarButton label="Upload image" onClick={() => fileInputRef.current?.click()}>
        <IconPhoto />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Undo / Redo */}
      <ToolbarButton label="Undo" onClick={undo} disabled={!canUndo}>
        <IconArrowBackUp />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={redo} disabled={!canRedo}>
        <IconArrowForwardUp />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Zoom controls */}
      <ToolbarButton label="Zoom out" onClick={handleZoomOut}>
        <IconZoomOut />
      </ToolbarButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="min-w-[3rem] text-center text-xs text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-accent"
          >
            {Math.round(zoom * 100)}%
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom">
          {ZOOM_PRESETS.map((level) => (
            <DropdownMenuItem
              key={level}
              onClick={() => setZoom(level)}
              className={zoom === level ? "bg-accent" : ""}
            >
              {Math.round(level * 100)}%
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton label="Zoom in" onClick={handleZoomIn}>
        <IconZoomIn />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton label="Fit to screen" onClick={handleFitToScreen}>
        <IconFocusCentered />
      </ToolbarButton>
    </div>
  );
}

// ---- toolbar button wrapper ------------------------------------------------

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
