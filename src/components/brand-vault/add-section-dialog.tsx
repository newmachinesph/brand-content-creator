import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrandStore } from "@/stores/brand-store";

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSectionDialog({
  open,
  onOpenChange,
}: AddSectionDialogProps) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"document" | "list">("document");
  const addSection = useBrandStore((s) => s.addSection);

  function handleCreate() {
    if (!label.trim()) return;
    const icon = kind === "document" ? "IconFile" : "IconList";
    addSection(kind, label.trim(), icon);
    setLabel("");
    setKind("document");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="section-label">Section Name</Label>
            <Input
              id="section-label"
              placeholder="e.g. Competitor Analysis"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as "document" | "list")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document (free-form text)</SelectItem>
                <SelectItem value="list">List (structured items)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!label.trim()}>
            Create Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
