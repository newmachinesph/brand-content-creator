import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import type {
  ContentType,
  ContentPlatform,
  StoryboardItem,
} from "@/types/storyboard";
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_PLATFORMS,
} from "@/types/storyboard";

interface StoryboardItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    contentType: ContentType;
    platform?: ContentPlatform;
    title: string;
    brief: string;
  }) => void;
  editItem?: StoryboardItem;
}

export function StoryboardItemForm({
  open,
  onOpenChange,
  onSubmit,
  editItem,
}: StoryboardItemFormProps) {
  const [contentType, setContentType] = useState<ContentType>("social-post");
  const [platform, setPlatform] = useState<ContentPlatform | "">("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");

  useEffect(() => {
    if (editItem) {
      setContentType(editItem.contentType);
      setPlatform(editItem.platform ?? "");
      setTitle(editItem.title);
      setBrief(editItem.brief);
    } else {
      setContentType("social-post");
      setPlatform("");
      setTitle("");
      setBrief("");
    }
  }, [editItem, open]);

  const platforms = CONTENT_TYPE_PLATFORMS[contentType] ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !brief.trim()) return;
    onSubmit({
      contentType,
      platform: platform || undefined,
      title: title.trim(),
      brief: brief.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit Content Item" : "Add Content Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Content Type</Label>
              <Select
                value={contentType}
                onValueChange={(v) => {
                  setContentType(v as ContentType);
                  setPlatform("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Platform</Label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as ContentPlatform)}
                disabled={platforms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-title">Title</Label>
            <Input
              id="item-title"
              placeholder="e.g. Product Launch Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-brief">Brief</Label>
            <Textarea
              id="item-brief"
              placeholder="Describe what this content should cover, the key message, call-to-action, etc."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
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
            <Button type="submit" disabled={!title.trim() || !brief.trim()}>
              {editItem ? "Save" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
