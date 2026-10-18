import { useState, useEffect, useCallback } from "react";
import {
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconQuestionMark,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import type { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCanvasContext } from "./canvas-context";

// ---- helpers ---------------------------------------------------------------

function getTypeIcon(type: string) {
  switch (type) {
    case "text":
    case "i-text":
    case "textbox":
      return <IconTypography className="size-3.5" />;
    case "image":
      return <IconPhoto className="size-3.5" />;
    case "rect":
      return <IconSquare className="size-3.5" />;
    case "circle":
      return <IconCircle className="size-3.5" />;
    case "line":
      return <IconMinus className="size-3.5" />;
    default:
      return <IconQuestionMark className="size-3.5" />;
  }
}

function getObjectLabel(obj: FabricObject): string {
  const type = obj.type ?? "object";

  // For text objects, show a preview of the content
  if (type === "text" || type === "i-text" || type === "textbox") {
    const textObj = obj as FabricObject & { text?: string };
    const text = textObj.text ?? "";
    if (text.length > 20) {
      return text.slice(0, 20) + "...";
    }
    return text || "Text";
  }

  // Capitalize the type name
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ---- component -------------------------------------------------------------

export function LayersPanel() {
  const { canvas, selectedObject } = useCanvasContext();

  // Force re-render when canvas objects change
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Listen for canvas changes
  useEffect(() => {
    if (!canvas) return;

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ] as const;

    const handler = () => refresh();

    events.forEach((event) => canvas.on(event, handler));

    return () => {
      events.forEach((event) => canvas.off(event, handler));
    };
  }, [canvas, refresh]);

  if (!canvas) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold">Layers</h3>
        </div>
        <div className="flex items-center justify-center px-4 py-8">
          <p className="text-center text-xs text-muted-foreground">
            No canvas loaded
          </p>
        </div>
      </div>
    );
  }

  // Reverse z-order: top layer first
  const objects = [...canvas.getObjects()].reverse();

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">Layers</h3>
      </div>

      {objects.length === 0 ? (
        <div className="flex items-center justify-center px-4 py-8">
          <p className="text-center text-xs text-muted-foreground">
            No layers yet. Add elements from the toolbar.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {objects.map((obj, index) => (
              <LayerRow
                key={index}
                obj={obj}
                isActive={selectedObject === obj}
                canvas={canvas}
                onRefresh={refresh}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ---- layer row -------------------------------------------------------------

function LayerRow({
  obj,
  isActive,
  canvas,
  onRefresh,
}: {
  obj: FabricObject;
  isActive: boolean;
  canvas: NonNullable<ReturnType<typeof useCanvasContext>["canvas"]>;
  onRefresh: () => void;
}) {
  const isVisible = obj.visible !== false;
  const isLocked = obj.selectable === false;

  function handleSelect() {
    canvas.setActiveObject(obj);
    canvas.renderAll();
  }

  function toggleVisibility(e: React.MouseEvent) {
    e.stopPropagation();
    obj.set({ visible: !isVisible });
    canvas.renderAll();
    onRefresh();
  }

  function toggleLock(e: React.MouseEvent) {
    e.stopPropagation();
    obj.set({ selectable: isLocked });
    canvas.renderAll();
    onRefresh();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 py-1.5 px-2 text-xs transition-colors",
        "hover:bg-muted/50",
        isActive && "bg-muted",
        !isVisible && "opacity-50",
      )}
    >
      {/* Type icon */}
      <span className="shrink-0 text-muted-foreground">
        {getTypeIcon(obj.type ?? "object")}
      </span>

      {/* Label */}
      <span className="flex-1 truncate">
        {getObjectLabel(obj)}
      </span>

      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={toggleVisibility}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        {isVisible ? <IconEye className="size-3" /> : <IconEyeOff className="size-3" />}
      </Button>

      {/* Lock toggle */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={toggleLock}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        {isLocked ? <IconLock className="size-3" /> : <IconLockOpen className="size-3" />}
      </Button>
    </div>
  );
}
