import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";

const MAX_HISTORY = 50;

/** Standard zoom presets available throughout the design studio */
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2] as const;

interface CanvasContextType {
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  fitToScreen: (containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushSnapshot: () => void;
  initHistory: (canvas: FabricCanvas) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [canvas, setCanvasState] = useState<FabricCanvas | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
    null,
  );
  const [zoomState, setZoomState] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // History array: index 0 = initial state, last = most recent state
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  // Keep ref and state in sync
  const setCanvas = useCallback((c: FabricCanvas | null) => {
    canvasRef.current = c;
    setCanvasState(c);
  }, []);

  const updateFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Zoom setter: only updates state; CanvasEditor applies it to the fabric canvas
  const setZoom = useCallback((z: number) => {
    setZoomState(z);
  }, []);

  // Calculate and apply zoom level to fit the canvas design within the viewport container
  const fitToScreen = useCallback(
    (containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) => {
      if (canvasWidth <= 0 || canvasHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) return;
      const fitZoom = Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight) * 0.9;
      const clamped = Math.max(0.1, Math.min(5, fitZoom));
      setZoomState(Math.round(clamped * 100) / 100);
    },
    [],
  );

  // Capture the initial canvas state as the baseline for undo history
  const initHistory = useCallback(
    (c: FabricCanvas) => {
      const json = JSON.stringify(c.toJSON());
      historyRef.current = [json];
      historyIndexRef.current = 0;
      updateFlags();
    },
    [updateFlags],
  );

  const pushSnapshot = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || isRestoringRef.current) return;

    const json = JSON.stringify(cv.toJSON());

    // If history is empty, treat this as the initial state
    if (historyRef.current.length === 0) {
      historyRef.current = [json];
      historyIndexRef.current = 0;
      updateFlags();
      return;
    }

    // Truncate any "future" states after current index
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );

    historyRef.current.push(json);

    // Trim to max history
    if (historyRef.current.length > MAX_HISTORY) {
      const excess = historyRef.current.length - MAX_HISTORY;
      historyRef.current = historyRef.current.slice(excess);
      historyIndexRef.current -= excess;
    }

    historyIndexRef.current = historyRef.current.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv || historyIndexRef.current <= 0) return;

    isRestoringRef.current = true;
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    await cv.loadFromJSON(json);
    cv.renderAll();
    isRestoringRef.current = false;
    updateFlags();
  }, [updateFlags]);

  const redo = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv || historyIndexRef.current >= historyRef.current.length - 1)
      return;

    isRestoringRef.current = true;
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    await cv.loadFromJSON(json);
    cv.renderAll();
    isRestoringRef.current = false;
    updateFlags();
  }, [updateFlags]);

  return (
    <CanvasContext.Provider
      value={{
        canvas,
        setCanvas,
        selectedObject,
        setSelectedObject,
        zoom: zoomState,
        setZoom,
        fitToScreen,
        undo,
        redo,
        canUndo,
        canRedo,
        pushSnapshot,
        initHistory,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext(): CanvasContextType {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return ctx;
}
