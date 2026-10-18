import { useState, useEffect } from "react";
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
import type { Frame, CreateFrameInput } from "@/types/storyboard";
import type { ContentType, ContentPlatform } from "@/types/common";
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_PLATFORMS,
} from "@/types/common";

// ─── All content types for the select ──────────────────────────

const ALL_CONTENT_TYPES: ContentType[] = [
  "social-post",
  "email",
  "blog-article",
  "ad-copy",
  "landing-page",
  "video-script",
  "custom",
];

// ─── Component ─────────────────────────────────────────────────

interface FrameFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFrameInput) => void;
  editFrame?: Frame;
}

export function FrameForm({
  open,
  onOpenChange,
  onSubmit,
  editFrame,
}: FrameFormProps) {
  const isEditing = !!editFrame;

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType>("social-post");
  const [platform, setPlatform] = useState<ContentPlatform | "">("");
  const [brief, setBrief] = useState("");

  // Derive available platforms from the selected content type
  const availablePlatforms = CONTENT_TYPE_PLATFORMS[contentType] ?? [];
  const hasPlatforms = availablePlatforms.length > 0;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editFrame) {
        setTitle(editFrame.title);
        setContentType(editFrame.contentType);
        setPlatform(editFrame.platform ?? "");
        setBrief(editFrame.data.brief ?? "");
      } else {
        setTitle("");
        setContentType("social-post");
        setPlatform("");
        setBrief("");
      }
    }
  }, [open, editFrame]);

  // Clear platform when content type changes and the current platform is no longer valid
  useEffect(() => {
    if (platform) {
      const platforms = CONTENT_TYPE_PLATFORMS[contentType] ?? [];
      if (platforms.length === 0 || !platforms.includes(platform as ContentPlatform)) {
        setPlatform("");
      }
    }
  }, [contentType]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const data: CreateFrameInput = {
      title: title.trim(),
      contentType,
      ...(platform ? { platform: platform as ContentPlatform } : {}),
      ...(brief.trim() ? { brief: brief.trim() } : {}),
    };

    onSubmit(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Frame" : "Add Frame"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the frame details below."
              : "Configure a new content frame for your storyboard."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="frame-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="frame-title"
              placeholder="e.g. Instagram launch teaser"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Content Type */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="frame-content-type">Content Type</Label>
            <Select
              value={contentType}
              onValueChange={(value) => setContentType(value as ContentType)}
            >
              <SelectTrigger id="frame-content-type" className="w-full">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CONTENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CONTENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="frame-platform">Platform</Label>
            <Select
              value={platform || undefined}
              onValueChange={(value) => setPlatform(value as ContentPlatform)}
              disabled={!hasPlatforms}
            >
              <SelectTrigger id="frame-platform" className="w-full">
                <SelectValue
                  placeholder={
                    hasPlatforms
                      ? "Select platform"
                      : "No platforms for this type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brief */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="frame-brief">Brief</Label>
            <Textarea
              id="frame-brief"
              placeholder="Describe the content you need for this frame..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? "Save" : "Add Frame"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
