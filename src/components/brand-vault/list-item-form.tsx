import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { IconPlus, IconX } from "@tabler/icons-react";
import type { BrandListItem } from "@/types/brand";

interface ListItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: BrandListItem;
  onSave: (data: {
    title: string;
    content: string;
    metadata?: Record<string, string>;
  }) => void;
}

export function ListItemForm({
  open,
  onOpenChange,
  item,
  onSave,
}: ListItemFormProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [metaEntries, setMetaEntries] = useState<[string, string][]>(
    item?.metadata ? Object.entries(item.metadata) : []
  );
  // Key to force MarkdownEditor remount when switching items
  const editorKeyRef = useRef(0);

  // Sync form fields whenever the item prop changes (e.g. editing a different item)
  useEffect(() => {
    setTitle(item?.title ?? "");
    setContent(item?.content ?? "");
    setMetaEntries(item?.metadata ? Object.entries(item.metadata) : []);
    editorKeyRef.current += 1;
  }, [item]);

  function handleSave() {
    if (!title.trim()) return;
    const metadata: Record<string, string> = {};
    for (const [k, v] of metaEntries) {
      if (k.trim()) metadata[k.trim()] = v.trim();
    }
    onSave({
      title: title.trim(),
      content: content.trim(),
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
    onOpenChange(false);
  }

  function addMetaEntry() {
    setMetaEntries([...metaEntries, ["", ""]]);
  }

  function updateMetaEntry(index: number, key: string, value: string) {
    const updated = [...metaEntries];
    updated[index] = [key, value];
    setMetaEntries(updated);
  }

  function removeMetaEntry(index: number) {
    setMetaEntries(metaEntries.filter((_, i) => i !== index));
  }

  // Reset form when dialog opens with new data
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTitle(item?.title ?? "");
      setContent(item?.content ?? "");
      setMetaEntries(item?.metadata ? Object.entries(item.metadata) : []);
      editorKeyRef.current += 1;
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-[1400px] flex-col">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="item-title">Title</Label>
            <Input
              id="item-title"
              placeholder="Item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col space-y-2">
            <Label>Content</Label>
            <MarkdownEditor
              key={editorKeyRef.current}
              defaultValue={content}
              onChange={setContent}
              className="min-h-[250px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Metadata (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={addMetaEntry}
              >
                <IconPlus className="h-3 w-3" />
                Add field
              </Button>
            </div>
            {metaEntries.map(([key, val], i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={key}
                  onChange={(e) => updateMetaEntry(i, e.target.value, val)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={val}
                  onChange={(e) => updateMetaEntry(i, key, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeMetaEntry(i)}
                >
                  <IconX className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {item ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
