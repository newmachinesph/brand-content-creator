import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconBrush,
  IconPlus,
  IconDownload,
  IconEdit,
  IconCheck,
  IconPhoto,
  IconStack2,
  IconWand,
  IconFocusCentered,
  IconArrowBack,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDesignStore } from "@/stores/design-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useAppStore } from "@/stores/app-store";
import { PLATFORM_LABELS } from "@/types/common";

import { CanvasProvider, useCanvasContext, ZOOM_PRESETS } from "./canvas-context";
import { CanvasEditor } from "./canvas-editor";
import { CanvasToolbar } from "./canvas-toolbar";
import { PropertiesPanel } from "./properties-panel";
import { LayersPanel } from "./layers-panel";
import { NewDesignDialog } from "./new-design-dialog";
import { ExportDialog } from "./export-dialog";
import { AssetRequestsPanel } from "./asset-requests-panel";
import { AutoDesignPanel } from "./auto-design-panel";
import { preloadDefaultFonts } from "@/lib/google-fonts";

// ─── Autosave hook ───────────────────────────────────────────────

function useAutosave() {
  const { canvas } = useCanvasContext();
  const updateDesign = useDesignStore((s) => s.updateDesign);
  const activeDesignId = useDesignStore((s) => s.activeDesignId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    if (!canvas || !activeDesignId) return;
    try {
      const canvasJson = canvas.toJSON();
      updateDesign(activeDesignId, { canvasJson });
    } catch {
      // Canvas may be in an invalid state during transitions
    }
  }, [canvas, activeDesignId, updateDesign]);

  useEffect(() => {
    if (!canvas) return;

    const handleChange = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, 2000);
    };

    canvas.on("object:modified", handleChange);
    canvas.on("object:added", handleChange);
    canvas.on("object:removed", handleChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      canvas.off("object:modified", handleChange);
      canvas.off("object:added", handleChange);
      canvas.off("object:removed", handleChange);
    };
  }, [canvas, save]);
}

// ─── Editable name ───────────────────────────────────────────────

function EditableName({
  value,
  onSave,
}: {
  value: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
      >
        <span className="truncate max-w-[200px]">{value}</span>
        <IconEdit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 w-[200px] text-sm font-semibold"
      />
      <Button variant="ghost" size="icon-xs" onClick={commit}>
        <IconCheck className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── Design workspace (inner, needs canvas context) ──────────────

type RightPanelTab = "auto-design" | "properties" | "requests";

function DesignWorkspace() {
  useAutosave();

  const { canvas, zoom, setZoom, fitToScreen } = useCanvasContext();
  const activeDesignId = useDesignStore((s) => s.activeDesignId);
  const getActiveDesign = useDesignStore((s) => s.getActiveDesign);
  const updateDesign = useDesignStore((s) => s.updateDesign);
  const frames = useStoryboardStore((s) => s.frames);
  const setActiveStoryboard = useStoryboardStore((s) => s.setActiveStoryboard);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const [exportOpen, setExportOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>("auto-design");

  const design = getActiveDesign();
  const linkedFrame = design?.frameId ? frames.find((f) => f.id === design.frameId) : undefined;

  const navigateToFrame = useCallback(() => {
    if (!linkedFrame) return;
    const sb = storyboards.find((s) => s.id === linkedFrame.storyboardId);
    if (sb) setActiveStoryboard(sb.id);
    setActiveModule("storyboards");
  }, [linkedFrame, storyboards, setActiveStoryboard, setActiveModule]);

  // Load canvasJson when activeDesignId changes
  const prevDesignIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!canvas || !design) return;
    if (prevDesignIdRef.current === activeDesignId) return;
    prevDesignIdRef.current = activeDesignId;

    const json = design.canvasJson;
    if (json && typeof json === "object" && "objects" in json) {
      canvas.loadFromJSON(json).then(() => {
        canvas.renderAll();
      });
    }
  }, [canvas, design, activeDesignId]);

  if (!design) return null;

  const statusLabel =
    design.status.charAt(0).toUpperCase() +
    design.status.slice(1).replace("_", " ");

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <EditableName
            value={design.name}
            onSave={(name) => updateDesign(design.id, { name })}
          />
          {design.platform && (
            <Badge variant="outline" className="text-[10px]">
              {PLATFORM_LABELS[design.platform] ?? design.platform}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] font-mono">
            {design.width} x {design.height}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px]",
              design.status === "approved" && "bg-green-500/10 text-green-600",
              design.status === "exported" && "bg-blue-500/10 text-blue-600",
            )}
          >
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {linkedFrame && (
            <Button variant="ghost" size="sm" onClick={navigateToFrame} title="Back to linked frame">
              <IconArrowBack className="h-3.5 w-3.5" />
              <span className="text-[11px] max-w-[120px] truncate">{linkedFrame.title}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <IconDownload className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <CanvasToolbar />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div data-canvas-viewport className="flex-1 overflow-auto flex items-center justify-center bg-muted/10 relative">
          <CanvasEditor
            width={design.width}
            height={design.height}
            initialJson={design.canvasJson}
          />
        </div>

        {/* Right panel */}
        <div className="w-[280px] shrink-0 border-l border-border flex flex-col overflow-hidden min-h-0">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setRightTab("auto-design")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                rightTab === "auto-design"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconWand className="h-3.5 w-3.5" />
              Auto
            </button>
            <button
              onClick={() => setRightTab("properties")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                rightTab === "properties"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconStack2 className="h-3.5 w-3.5" />
              Props
            </button>
            <button
              onClick={() => setRightTab("requests")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                rightTab === "requests"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconPhoto className="h-3.5 w-3.5" />
              Requests
            </button>
          </div>

          {/* Tab content */}
          {rightTab === "auto-design" && <AutoDesignPanel />}
          {rightTab === "properties" && (
            <div className="flex flex-1 flex-col min-h-0">
              <PropertiesPanel />
              <Separator />
              <LayersPanel />
            </div>
          )}
          {rightTab === "requests" && <AssetRequestsPanel />}
        </div>
      </div>

      {/* Bottom zoom controls */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-1.5">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setZoom(Math.max(0.1, Math.round((zoom - 0.1) * 100) / 100))}
        >
          -
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-[11px] text-muted-foreground font-mono w-12 text-center cursor-pointer hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-accent"
            >
              {Math.round(zoom * 100)}%
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            {ZOOM_PRESETS.map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => setZoom(level)}
                className={Math.abs(zoom - level) < 0.01 ? "bg-accent" : ""}
              >
                {Math.round(level * 100)}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setZoom(Math.min(5, Math.round((zoom + 0.1) * 100) / 100))}
        >
          +
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Preset zoom levels */}
        {ZOOM_PRESETS.map((level) => (
          <Button
            key={level}
            variant={Math.abs(zoom - level) < 0.01 ? "secondary" : "ghost"}
            size="xs"
            className="text-[10px] px-1.5 font-mono"
            onClick={() => setZoom(level)}
          >
            {Math.round(level * 100)}%
          </Button>
        ))}

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Fit to screen */}
        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-[10px]"
          onClick={() => {
            const container = document.querySelector(
              "[data-canvas-viewport]"
            );
            if (container && design) {
              fitToScreen(
                container.clientWidth,
                container.clientHeight,
                design.width,
                design.height,
              );
            }
          }}
        >
          <IconFocusCentered className="h-3 w-3" />
          Fit
        </Button>
      </div>

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────

function EmptyState({ onNewDesign }: { onNewDesign: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <IconBrush className="h-12 w-12 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-foreground">No designs yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Create your first design to start composing graphics
        </p>
      </div>
      <Button onClick={onNewDesign}>
        <IconPlus className="h-4 w-4" />
        New Design
      </Button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────

export function DesignStudioPage() {
  const designs = useDesignStore((s) => s.designs);
  const activeDesignId = useDesignStore((s) => s.activeDesignId);
  const [newDesignOpen, setNewDesignOpen] = useState(false);

  // Preload default Google Fonts on mount
  useEffect(() => {
    preloadDefaultFonts();
  }, []);

  // Listen for create events from sidebar
  useEffect(() => {
    const handler = () => { setNewDesignOpen(true); };
    window.addEventListener("design-create-trigger", handler);
    return () => window.removeEventListener("design-create-trigger", handler);
  }, []);

  const hasActiveDesign =
    activeDesignId !== null &&
    designs.some((d) => d.id === activeDesignId);

  return (
    <div className="flex h-full flex-col">
      {hasActiveDesign ? (
        <>
          {/* Top bar with new design button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
            <div className="flex items-center gap-2">
              <IconBrush className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                Design Studio
              </span>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setNewDesignOpen(true)}
            >
              <IconPlus className="h-3 w-3" />
              New Design
            </Button>
          </div>

          <CanvasProvider>
            <DesignWorkspace />
          </CanvasProvider>
        </>
      ) : (
        <EmptyState onNewDesign={() => setNewDesignOpen(true)} />
      )}

      <NewDesignDialog open={newDesignOpen} onOpenChange={setNewDesignOpen} />
    </div>
  );
}
