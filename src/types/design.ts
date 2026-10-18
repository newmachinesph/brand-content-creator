import type { ContentPlatform } from "./common";

export type DesignStatus = "draft" | "in_progress" | "review" | "approved" | "exported";

export interface Design {
  id: string;
  brandId: string;
  frameId?: string;
  name: string;
  canvasJson: object;
  thumbnail?: string;
  width: number;
  height: number;
  platform?: ContentPlatform;
  format?: string;
  status: DesignStatus;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignInput {
  name: string;
  width: number;
  height: number;
  platform?: ContentPlatform;
  format?: string;
  frameId?: string;
  canvasJson?: object;
}

// ─── Auto-design spec (Claude → canvas pipeline) ────────────────

export interface DesignSpecGradient {
  type: "linear" | "radial";
  coords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    r1?: number;
    r2?: number;
  };
  colorStops: { offset: number; color: string }[];
}

export interface DesignSpecShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface DesignSpecTextBlock {
  text: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | string;
  fill: string;
  x: number;
  y: number;
  textAlign?: "left" | "center" | "right";
  originX?: "left" | "center" | "right";
  originY?: "top" | "center" | "bottom";
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  charSpacing?: number;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  shadow?: DesignSpecShadow;
  maxWidth?: number;
  opacity?: number;
}

export interface DesignSpecShape {
  type: "rect" | "circle" | "line";
  x: number;
  y: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  // rect
  width?: number;
  height?: number;
  rx?: number;
  // circle
  radius?: number;
  // line
  x2?: number;
  y2?: number;
  // rich rendering
  gradient?: DesignSpecGradient;
  shadow?: DesignSpecShadow;
}

export interface DesignSpecImagePlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface DesignSpec {
  backgroundColor: string;
  backgroundGradient?: DesignSpecGradient;
  fonts?: string[];
  textBlocks: DesignSpecTextBlock[];
  shapes: DesignSpecShape[];
  imagePlaceholder?: DesignSpecImagePlaceholder;
  imagePrompt?: string;
  needsImage: boolean;
}
