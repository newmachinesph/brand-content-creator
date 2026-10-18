import { useEffect, useRef, useCallback } from "react";
import { Canvas, ActiveSelection } from "fabric";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { useCanvasContext } from "./canvas-context";

interface CanvasEditorProps {
  width: number;
  height: number;
  initialJson?: object;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

const SNAPSHOT_DEBOUNCE_MS = 300;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const VIEWPORT_PADDING = 40; // px padding around canvas inside viewport

export function CanvasEditor({
  width,
  height,
  initialJson,
  onCanvasReady,
}: CanvasEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    setCanvas,
    setSelectedObject,
    setZoom,
    zoom,
    pushSnapshot,
    undo,
    redo,
    initHistory,
  } = useCanvasContext();

  // Stable ref for pushSnapshot so event handlers always call the latest version
  const pushSnapshotRef = useRef(pushSnapshot);
  pushSnapshotRef.current = pushSnapshot;

  const initHistoryRef = useRef(initHistory);
  initHistoryRef.current = initHistory;

  const debouncedPushSnapshot = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      pushSnapshotRef.current();
    }, SNAPSHOT_DEBOUNCE_MS);
  }, []);

  // Initialize the Fabric canvas
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const wrapper = wrapperRef.current;
    if (!canvasEl || !wrapper) return;

    // Calculate fit zoom based on available viewport space
    const availableW = wrapper.clientWidth - VIEWPORT_PADDING * 2;
    const availableH = wrapper.clientHeight - VIEWPORT_PADDING * 2;
    const fitZoom = Math.min(availableW / width, availableH / height, 1);
    const initialZoom = Math.round(fitZoom * 100) / 100;

    const fabricCanvas = new Canvas(canvasEl, {
      width: Math.round(width * initialZoom),
      height: Math.round(height * initialZoom),
      backgroundColor: "#ffffff",
    });

    fabricCanvas.setZoom(initialZoom);
    fabricRef.current = fabricCanvas;
    setCanvas(fabricCanvas);
    setZoom(initialZoom);

    // ------------------------------------------------------------------
    // Selection events -> update selectedObject in context
    // ------------------------------------------------------------------
    const handleSelectionCreated = (e: { selected: FabricObject[] }) => {
      setSelectedObject(e.selected?.[0] ?? null);
    };
    const handleSelectionUpdated = (e: { selected: FabricObject[] }) => {
      setSelectedObject(e.selected?.[0] ?? null);
    };
    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    fabricCanvas.on("selection:created", handleSelectionCreated);
    fabricCanvas.on("selection:updated", handleSelectionUpdated);
    fabricCanvas.on("selection:cleared", handleSelectionCleared);

    // ------------------------------------------------------------------
    // Object mutation events -> debounced snapshot
    // ------------------------------------------------------------------
    fabricCanvas.on("object:modified", debouncedPushSnapshot);
    fabricCanvas.on("object:added", debouncedPushSnapshot);
    fabricCanvas.on("object:removed", debouncedPushSnapshot);

    // ------------------------------------------------------------------
    // Load initial JSON if provided, then notify consumer
    // ------------------------------------------------------------------
    const init = async () => {
      if (initialJson) {
        await fabricCanvas.loadFromJSON(initialJson);
        fabricCanvas.setZoom(initialZoom);
        fabricCanvas.renderAll();
      }
      // Capture the initial canvas state as the baseline for undo history
      initHistoryRef.current(fabricCanvas);
      onCanvasReady?.(fabricCanvas);
    };
    init();

    // ------------------------------------------------------------------
    // Cleanup
    // ------------------------------------------------------------------
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      fabricCanvas.off("selection:created", handleSelectionCreated);
      fabricCanvas.off("selection:updated", handleSelectionUpdated);
      fabricCanvas.off("selection:cleared", handleSelectionCleared);
      fabricCanvas.off("object:modified", debouncedPushSnapshot);
      fabricCanvas.off("object:added", debouncedPushSnapshot);
      fabricCanvas.off("object:removed", debouncedPushSnapshot);

      fabricCanvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
    // We intentionally run this effect only on mount/unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Sync zoom state to Fabric canvas dimensions + viewport zoom
  // ------------------------------------------------------------------
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    fc.setZoom(zoom);
    fc.setDimensions({
      width: Math.round(width * zoom),
      height: Math.round(height * zoom),
    });
    fc.requestRenderAll();
  }, [zoom, width, height]);

  // ------------------------------------------------------------------
  // Ctrl+Scroll zoom handler
  // ------------------------------------------------------------------
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const fc = fabricRef.current;
      if (!fc) return;

      const delta = -e.deltaY;
      const scaleFactor = 1 + delta * 0.001;
      let newZoom = zoom * scaleFactor;
      newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      newZoom = Math.round(newZoom * 100) / 100;

      setZoom(newZoom);
    },
    [zoom, setZoom],
  );

  // ------------------------------------------------------------------
  // Keyboard shortcuts
  // ------------------------------------------------------------------
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace — remove selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = fc.getActiveObject();
        if (active) {
          e.preventDefault();
          fc.remove(active);
          fc.discardActiveObject();
          fc.renderAll();
          pushSnapshotRef.current();
        }
        return;
      }

      // Ctrl+Z — undo
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — redo
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+D — duplicate
      if (ctrl && e.key === "d") {
        const active = fc.getActiveObject();
        if (active) {
          e.preventDefault();
          active.clone().then((cloned: FabricObject) => {
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
            fc.add(cloned);
            fc.setActiveObject(cloned);
            fc.renderAll();
            pushSnapshotRef.current();
          });
        }
        return;
      }

      // Ctrl+A — select all
      if (ctrl && e.key === "a") {
        e.preventDefault();
        fc.discardActiveObject();
        const objs = fc.getObjects();
        if (objs.length > 0) {
          const sel = new ActiveSelection(objs, { canvas: fc });
          fc.setActiveObject(sel);
          fc.renderAll();
        }
        return;
      }

      // Arrow keys — nudge selected object
      const NUDGE = e.shiftKey ? 10 : 1;
      const active = fc.getActiveObject();
      if (active) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          active.set({ left: (active.left ?? 0) - NUDGE });
          fc.renderAll();
          pushSnapshotRef.current();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          active.set({ left: (active.left ?? 0) + NUDGE });
          fc.renderAll();
          pushSnapshotRef.current();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          active.set({ top: (active.top ?? 0) - NUDGE });
          fc.renderAll();
          pushSnapshotRef.current();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          active.set({ top: (active.top ?? 0) + NUDGE });
          fc.renderAll();
          pushSnapshotRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-muted/30"
      onWheel={handleWheel}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
}
