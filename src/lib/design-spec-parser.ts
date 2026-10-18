import { FabricText, Textbox, Rect, Circle, Line, Gradient, Shadow } from "fabric";
import type { Canvas as FabricCanvas } from "fabric";
import type {
  DesignSpec,
  DesignSpecGradient,
  DesignSpecShadow,
} from "@/types/design";
import { loadFontsFromSpec } from "@/lib/google-fonts";

/**
 * Parse raw Claude output into a DesignSpec object.
 * Handles cases where Claude wraps the JSON in markdown fences.
 */
export function parseDesignSpec(raw: string): DesignSpec {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Find the first { and last } to extract JSON
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in Claude output");
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (typeof parsed.backgroundColor !== "string") {
    parsed.backgroundColor = "#ffffff";
  }
  if (!Array.isArray(parsed.textBlocks)) {
    parsed.textBlocks = [];
  }
  if (!Array.isArray(parsed.shapes)) {
    parsed.shapes = [];
  }
  if (typeof parsed.needsImage !== "boolean") {
    parsed.needsImage = false;
  }

  return parsed as DesignSpec;
}

// ─── Fabric.js conversion helpers ───────────────────────────────────────────

function toFabricGradient(
  spec: DesignSpecGradient,
  objectWidth: number,
  objectHeight: number,
): Gradient<"linear" | "radial"> {
  const { type, coords, colorStops } = spec;

  // Scale normalized coords (0-1) or pixel coords to object dimensions
  const isNormalized =
    coords.x1 <= 1 && coords.y1 <= 1 && coords.x2 <= 1 && coords.y2 <= 1;

  const scaledCoords = isNormalized
    ? {
        x1: coords.x1 * objectWidth,
        y1: coords.y1 * objectHeight,
        x2: coords.x2 * objectWidth,
        y2: coords.y2 * objectHeight,
        ...(type === "radial" && {
          r1: (coords.r1 ?? 0) * Math.max(objectWidth, objectHeight),
          r2: (coords.r2 ?? 0.5) * Math.max(objectWidth, objectHeight),
        }),
      }
    : {
        x1: coords.x1,
        y1: coords.y1,
        x2: coords.x2,
        y2: coords.y2,
        ...(type === "radial" && {
          r1: coords.r1 ?? 0,
          r2: coords.r2 ?? Math.max(objectWidth, objectHeight) / 2,
        }),
      };

  return new Gradient({
    type,
    coords: scaledCoords,
    colorStops: colorStops.map((cs) => ({
      offset: cs.offset,
      color: cs.color,
    })),
  });
}

function toFabricShadow(spec: DesignSpecShadow): Shadow {
  return new Shadow({
    color: spec.color,
    blur: spec.blur,
    offsetX: spec.offsetX,
    offsetY: spec.offsetY,
  });
}

// ─── Apply DesignSpec to Canvas ─────────────────────────────────────────────

/**
 * Apply a DesignSpec to a Fabric.js canvas, creating all elements.
 * Loads Google Fonts first, then clears existing objects and builds the layout.
 */
export async function applyDesignSpec(
  canvas: FabricCanvas,
  spec: DesignSpec,
): Promise<void> {
  // Load all fonts before rendering
  await loadFontsFromSpec(spec);

  // Clear all existing objects
  canvas.clear();

  const canvasW = canvas.getWidth();
  const canvasH = canvas.getHeight();

  // Set background color
  canvas.backgroundColor = spec.backgroundColor || "#0a0a0a";

  // Background gradient (full-canvas rect)
  if (spec.backgroundGradient) {
    const bgRect = new Rect({
      left: 0,
      top: 0,
      width: canvasW,
      height: canvasH,
      selectable: false,
      evented: false,
    });
    bgRect.set(
      "fill",
      toFabricGradient(spec.backgroundGradient, canvasW, canvasH),
    );
    canvas.add(bgRect);
  }

  // Add shapes (background elements)
  for (const shape of spec.shapes) {
    if (shape.type === "rect") {
      const w = shape.width ?? 200;
      const h = shape.height ?? 150;
      const rect = new Rect({
        left: shape.x ?? 0,
        top: shape.y ?? 0,
        width: w,
        height: h,
        fill: shape.fill ?? "#6366F1",
        stroke: shape.stroke || undefined,
        strokeWidth: shape.strokeWidth ?? 0,
        rx: shape.rx ?? 0,
        ry: shape.rx ?? 0,
        opacity: shape.opacity ?? 1,
      });

      if (shape.gradient) {
        rect.set("fill", toFabricGradient(shape.gradient, w, h));
      }
      if (shape.shadow) {
        rect.set("shadow", toFabricShadow(shape.shadow));
      }

      canvas.add(rect);
    } else if (shape.type === "circle") {
      const r = shape.radius ?? 75;
      const circle = new Circle({
        left: shape.x ?? 0,
        top: shape.y ?? 0,
        radius: r,
        fill: shape.fill ?? "#22D3EE",
        stroke: shape.stroke || undefined,
        strokeWidth: shape.strokeWidth ?? 0,
        opacity: shape.opacity ?? 1,
      });

      if (shape.gradient) {
        circle.set("fill", toFabricGradient(shape.gradient, r * 2, r * 2));
      }
      if (shape.shadow) {
        circle.set("shadow", toFabricShadow(shape.shadow));
      }

      canvas.add(circle);
    } else if (shape.type === "line") {
      const line = new Line(
        [shape.x ?? 0, shape.y ?? 0, shape.x2 ?? 200, shape.y2 ?? 0],
        {
          stroke: shape.fill ?? "#ffffff",
          strokeWidth: shape.strokeWidth ?? 2,
          opacity: shape.opacity ?? 1,
        },
      );

      if (shape.shadow) {
        line.set("shadow", toFabricShadow(shape.shadow));
      }

      canvas.add(line);
    }
  }

  // Add image placeholder (dashed rectangle) if needed
  if (spec.needsImage && spec.imagePlaceholder) {
    const ph = spec.imagePlaceholder;
    const placeholder = new Rect({
      left: ph.x,
      top: ph.y,
      width: ph.width,
      height: ph.height,
      fill: "#e2e2e2",
      stroke: "#999999",
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      opacity: 0.6,
      selectable: true,
    });
    // Tag it so we can find it later for replacement
    (placeholder as unknown as Record<string, unknown>).isImagePlaceholder =
      true;
    (placeholder as unknown as Record<string, unknown>).placeholderLabel =
      ph.label;
    canvas.add(placeholder);

    // Add placeholder label text
    const labelText = new FabricText(ph.label || "Upload image here", {
      fontSize: 14,
      fontWeight: "normal",
      fill: "#666666",
      left: ph.x + ph.width / 2,
      top: ph.y + ph.height / 2,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    (labelText as unknown as Record<string, unknown>).isPlaceholderLabel = true;
    canvas.add(labelText);
  }

  // Add text blocks on top
  for (const textBlock of spec.textBlocks) {
    // Apply textTransform
    let displayText = textBlock.text;
    if (textBlock.textTransform === "uppercase") {
      displayText = displayText.toUpperCase();
    } else if (textBlock.textTransform === "lowercase") {
      displayText = displayText.toLowerCase();
    }

    const commonProps = {
      fontSize: textBlock.fontSize ?? 24,
      fontWeight: textBlock.fontWeight ?? "normal",
      fontFamily: textBlock.fontFamily ?? "Inter",
      fontStyle: (textBlock.fontStyle ?? "normal") as "" | "normal" | "italic" | "oblique",
      fill: textBlock.fill ?? "#ffffff",
      left: textBlock.x ?? 0,
      top: textBlock.y ?? 0,
      textAlign: textBlock.textAlign ?? "left",
      originX: textBlock.originX ?? "left",
      originY: textBlock.originY ?? "top",
      charSpacing: textBlock.charSpacing ?? 0,
      lineHeight: textBlock.lineHeight ?? 1.2,
      opacity: textBlock.opacity ?? 1,
    };

    // Use Textbox for word wrapping when maxWidth is specified
    let textObj;
    if (textBlock.maxWidth && textBlock.maxWidth > 0) {
      textObj = new Textbox(displayText, {
        ...commonProps,
        width: textBlock.maxWidth,
      });
    } else {
      textObj = new FabricText(displayText, commonProps);
    }

    if (textBlock.shadow) {
      textObj.set("shadow", toFabricShadow(textBlock.shadow));
    }

    canvas.add(textObj);
  }

  canvas.renderAll();
}

/**
 * Replace the image placeholder on the canvas with an uploaded image.
 * Finds the dashed placeholder rectangle and swaps it with the image.
 */
export function findImagePlaceholder(canvas: FabricCanvas): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  const objects = canvas.getObjects();
  for (const obj of objects) {
    if ((obj as unknown as Record<string, unknown>).isImagePlaceholder) {
      return {
        x: obj.left ?? 0,
        y: obj.top ?? 0,
        width: (obj.width ?? 200) * (obj.scaleX ?? 1),
        height: (obj.height ?? 200) * (obj.scaleY ?? 1),
      };
    }
  }
  return null;
}

/**
 * Remove the placeholder rectangle and its label from the canvas.
 */
export function removePlaceholder(canvas: FabricCanvas): void {
  const objects = canvas.getObjects();
  const toRemove = objects.filter(
    (obj) =>
      (obj as unknown as Record<string, unknown>).isImagePlaceholder ||
      (obj as unknown as Record<string, unknown>).isPlaceholderLabel,
  );
  for (const obj of toRemove) {
    canvas.remove(obj);
  }
  canvas.renderAll();
}
