import { useState, useEffect, useCallback } from "react";
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconTrash,
  IconItalic,
} from "@tabler/icons-react";
import type { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanvasContext } from "./canvas-context";
import {
  GOOGLE_FONTS,
  FONT_CATEGORIES,
  WEIGHT_LABELS,
  getFontEntry,
  loadGoogleFont,
} from "@/lib/google-fonts";

// ---- helpers ---------------------------------------------------------------

function isTextObject(obj: FabricObject): boolean {
  const t = obj.type;
  return t === "text" || t === "i-text" || t === "textbox";
}

function isRectObject(obj: FabricObject): boolean {
  return obj.type === "rect";
}

function isShapeObject(obj: FabricObject): boolean {
  const t = obj.type;
  return t === "rect" || t === "circle";
}

// ---- component -------------------------------------------------------------

export function PropertiesPanel() {
  const { canvas, selectedObject, pushSnapshot } = useCanvasContext();

  // Force re-render when properties change
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Re-read properties when the selected object changes
  useEffect(() => {
    refresh();
  }, [selectedObject, refresh]);

  // ---- apply helper --------------------------------------------------------

  const apply = useCallback(
    (props: Record<string, unknown>) => {
      if (!canvas || !selectedObject) return;
      selectedObject.set(props);
      canvas.renderAll();
      pushSnapshot();
      refresh();
    },
    [canvas, selectedObject, pushSnapshot, refresh],
  );

  // ---- delete --------------------------------------------------------------

  const handleDelete = useCallback(() => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    pushSnapshot();
  }, [canvas, selectedObject, pushSnapshot]);

  // ---- empty state ---------------------------------------------------------

  if (!selectedObject) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-xs text-muted-foreground">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  // ---- computed values -----------------------------------------------------

  const obj = selectedObject;
  const posX = Math.round(obj.left ?? 0);
  const posY = Math.round(obj.top ?? 0);
  const width = Math.round((obj.width ?? 0) * (obj.scaleX ?? 1));
  const height = Math.round((obj.height ?? 0) * (obj.scaleY ?? 1));
  const angle = Math.round(obj.angle ?? 0);
  const opacity = Math.round((obj.opacity ?? 1) * 100);

  // ---- render --------------------------------------------------------------

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold capitalize">{obj.type}</h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          <IconTrash />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-3">
          {/* ---- Position ---- */}
          <fieldset className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField
                label="X"
                value={posX}
                onChange={(v) => apply({ left: v })}
              />
              <NumberField
                label="Y"
                value={posY}
                onChange={(v) => apply({ top: v })}
              />
            </div>
          </fieldset>

          {/* ---- Size ---- */}
          <fieldset className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField
                label="W"
                value={width}
                onChange={(v) => {
                  const currentW = obj.width ?? 1;
                  apply({ scaleX: v / currentW });
                }}
              />
              <NumberField
                label="H"
                value={height}
                onChange={(v) => {
                  const currentH = obj.height ?? 1;
                  apply({ scaleY: v / currentH });
                }}
              />
            </div>
          </fieldset>

          {/* ---- Rotation ---- */}
          <fieldset className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Rotation</Label>
            <NumberField
              label="deg"
              value={angle}
              onChange={(v) => apply({ angle: v })}
            />
          </fieldset>

          {/* ---- Opacity ---- */}
          <fieldset className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => apply({ opacity: Number(e.target.value) / 100 })}
              className="h-1.5 w-full cursor-pointer accent-primary"
            />
            <span className="text-[11px] text-muted-foreground">{opacity}%</span>
          </fieldset>

          <Separator />

          {/* ---- Text-specific ---- */}
          {isTextObject(obj) && (
            <TextProperties obj={obj} apply={apply} />
          )}

          {/* ---- Shape-specific ---- */}
          {isShapeObject(obj) && (
            <ShapeProperties obj={obj} apply={apply} isRect={isRectObject(obj)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- text properties -------------------------------------------------------

function TextProperties({
  obj,
  apply,
}: {
  obj: FabricObject;
  apply: (props: Record<string, unknown>) => void;
}) {
  const textObj = obj as FabricObject & {
    fontSize: number;
    fontFamily: string;
    fontWeight: string | number;
    fontStyle: string;
    textAlign: string;
    fill: string;
    text: string;
    charSpacing: number;
    lineHeight: number;
  };

  const currentFamily = textObj.fontFamily ?? "Inter";
  const fontEntry = getFontEntry(currentFamily);
  const availableWeights = fontEntry?.weights ?? [400, 700];

  const handleFontChange = useCallback(
    async (family: string) => {
      await loadGoogleFont(family);
      apply({ fontFamily: family });
    },
    [apply],
  );

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-xs font-semibold">Text</Label>

      {/* Font family */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Font</Label>
        <Select value={currentFamily} onValueChange={handleFontChange}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            {FONT_CATEGORIES.map((cat) => (
              <SelectGroup key={cat.id}>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  {cat.label}
                </SelectLabel>
                {GOOGLE_FONTS.filter((f) => f.category === cat.id).map((f) => (
                  <SelectItem key={f.family} value={f.family}>
                    {f.family}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </fieldset>

      {/* Font size */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Size</Label>
        <NumberField
          label="px"
          value={textObj.fontSize ?? 18}
          onChange={(v) => apply({ fontSize: v })}
        />
      </fieldset>

      {/* Font weight + style */}
      <div className="grid grid-cols-[1fr_auto] gap-1.5">
        <fieldset className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Weight</Label>
          <Select
            value={String(textObj.fontWeight ?? "400")}
            onValueChange={(v) => apply({ fontWeight: v })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableWeights.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {WEIGHT_LABELS[w] ?? w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <Button
            variant={textObj.fontStyle === "italic" ? "secondary" : "ghost"}
            size="icon-xs"
            className="h-7 w-7"
            onClick={() =>
              apply({
                fontStyle:
                  textObj.fontStyle === "italic" ? "normal" : "italic",
              })
            }
          >
            <IconItalic className="h-3.5 w-3.5" />
          </Button>
        </fieldset>
      </div>

      {/* Letter spacing */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Letter spacing</Label>
        <input
          type="range"
          min={0}
          max={300}
          step={10}
          value={textObj.charSpacing ?? 0}
          onChange={(e) => apply({ charSpacing: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer accent-primary"
        />
        <span className="text-[10px] text-muted-foreground">
          {textObj.charSpacing ?? 0}
        </span>
      </fieldset>

      {/* Line height */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Line height</Label>
        <input
          type="range"
          min={0.8}
          max={2.0}
          step={0.1}
          value={textObj.lineHeight ?? 1.2}
          onChange={(e) => apply({ lineHeight: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer accent-primary"
        />
        <span className="text-[10px] text-muted-foreground">
          {(textObj.lineHeight ?? 1.2).toFixed(1)}
        </span>
      </fieldset>

      {/* Text align */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Align</Label>
        <div className="flex gap-0.5">
          <AlignButton
            icon={<IconAlignLeft />}
            active={textObj.textAlign === "left"}
            onClick={() => apply({ textAlign: "left" })}
          />
          <AlignButton
            icon={<IconAlignCenter />}
            active={textObj.textAlign === "center"}
            onClick={() => apply({ textAlign: "center" })}
          />
          <AlignButton
            icon={<IconAlignRight />}
            active={textObj.textAlign === "right"}
            onClick={() => apply({ textAlign: "right" })}
          />
        </div>
      </fieldset>

      {/* Fill color */}
      <ColorField
        label="Fill color"
        value={String(textObj.fill ?? "#ffffff")}
        onChange={(v) => apply({ fill: v })}
      />

      {/* Content */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Content</Label>
        <Textarea
          value={textObj.text ?? ""}
          onChange={(e) => apply({ text: e.target.value })}
          className="min-h-[60px] text-xs"
          rows={3}
        />
      </fieldset>

      <Separator />
    </div>
  );
}

// ---- shape properties ------------------------------------------------------

function ShapeProperties({
  obj,
  apply,
  isRect,
}: {
  obj: FabricObject;
  apply: (props: Record<string, unknown>) => void;
  isRect: boolean;
}) {
  const shapeObj = obj as FabricObject & {
    fill: string;
    stroke: string;
    strokeWidth: number;
    rx: number;
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-xs font-semibold">Shape</Label>

      {/* Fill color */}
      <ColorField
        label="Fill color"
        value={String(shapeObj.fill ?? "#000000")}
        onChange={(v) => apply({ fill: v })}
      />

      {/* Stroke color */}
      <ColorField
        label="Stroke color"
        value={String(shapeObj.stroke ?? "")}
        onChange={(v) => apply({ stroke: v })}
      />

      {/* Stroke width */}
      <fieldset className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Stroke width</Label>
        <NumberField
          label="px"
          value={shapeObj.strokeWidth ?? 0}
          onChange={(v) => apply({ strokeWidth: v })}
        />
      </fieldset>

      {/* Corner radius (Rect only) */}
      {isRect && (
        <fieldset className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Corner radius</Label>
          <NumberField
            label="px"
            value={shapeObj.rx ?? 0}
            onChange={(v) => apply({ rx: v, ry: v })}
          />
        </fieldset>
      )}

      <Separator />
    </div>
  );
}

// ---- small reusable controls -----------------------------------------------

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  function commit() {
    const parsed = parseFloat(local);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocal(String(value));
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="h-7 pr-7 text-xs"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function commit() {
    onChange(local);
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5">
        <div
          className="h-6 w-6 shrink-0 border border-border"
          style={{ backgroundColor: local || "transparent" }}
        />
        <Input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="h-7 text-xs"
        />
      </div>
    </fieldset>
  );
}

function AlignButton({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon-xs"
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}
