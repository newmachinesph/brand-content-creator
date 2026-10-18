import { useState, useEffect } from "react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemoryStore } from "@/stores/memory-store";
import { useBrandStore } from "@/stores/brand-store";
import { cn } from "@/lib/utils";
import type { BrandMemory } from "@/types/memory";
import type { MemoryType } from "@/types/common";

// ─── Type labels ─────────────────────────────────────────────────

const MEMORY_TYPE_OPTIONS: { value: MemoryType; label: string; hint: string }[] = [
  { value: "preference", label: "Brand Likes", hint: "What the brand wants" },
  { value: "rejection", label: "Brand Dislikes", hint: "What to avoid" },
  { value: "approval", label: "Approved Pattern", hint: "Content that worked well" },
  { value: "feedback", label: "Feedback", hint: "Input from clients or team" },
  { value: "learned_style", label: "Learned Pattern", hint: "Recurring style or structure" },
];

// ─── Component ───────────────────────────────────────────────────

interface MemoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMemory?: BrandMemory;
}

export function MemoryForm({ open, onOpenChange, editMemory }: MemoryFormProps) {
  const isEditing = !!editMemory;
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const createMemory = useMemoryStore((s) => s.createMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<MemoryType>("preference");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [importance, setImportance] = useState(1);

  // Reset form when dialog opens or editMemory changes
  useEffect(() => {
    if (open) {
      if (editMemory) {
        setTitle(editMemory.title);
        setType(editMemory.type);
        setContent(editMemory.content);
        setTagsInput(editMemory.tags.join(", "));
        setImportance(editMemory.importance);
      } else {
        setTitle("");
        setType("preference");
        setContent("");
        setTagsInput("");
        setImportance(1);
      }
    }
  }, [open, editMemory]);

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = parseTags(tagsInput);

    if (isEditing && editMemory) {
      updateMemory(editMemory.id, {
        title: title.trim(),
        type,
        content: content.trim(),
        tags,
        importance,
      });
    } else if (activeBrandId) {
      createMemory(activeBrandId, {
        type,
        title: title.trim(),
        content: content.trim(),
        tags,
        importance,
      });
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Memory" : "New Memory"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the memory details below."
              : "Add a new memory entry to help maintain brand consistency."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="memory-title"
              placeholder="e.g. Prefers warm color palette"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MemoryType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span>{opt.label}</span>
                    <span className="ml-1.5 text-muted-foreground">
                      — {opt.hint}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="memory-content"
              placeholder="Describe this memory in detail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-tags">Tags</Label>
            <Input
              id="memory-tags"
              placeholder="e.g. color, branding, visual (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Importance */}
          <div className="flex flex-col gap-2">
            <Label>Importance</Label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => {
                const starIndex = i + 1;
                const isFilled = starIndex <= importance;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setImportance(starIndex)}
                    className={cn(
                      "rounded p-0.5 transition-colors hover:text-amber-400",
                      isFilled ? "text-amber-400" : "text-muted-foreground/40"
                    )}
                  >
                    {isFilled ? (
                      <IconStarFilled className="h-5 w-5" />
                    ) : (
                      <IconStar className="h-5 w-5" />
                    )}
                  </button>
                );
              })}
              <span className="ml-2 text-[11px] text-muted-foreground">
                {importance} of 5
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim()}
            >
              {isEditing ? "Save" : "Add Memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
