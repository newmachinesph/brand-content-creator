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
import { cn } from "@/lib/utils";
import type { Campaign, CreateCampaignInput } from "@/types/campaign";
import type { ContentPlatform } from "@/types/common";
import { PLATFORM_LABELS } from "@/types/common";
import {
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconMail,
  IconWorld,
  IconDots,
} from "@tabler/icons-react";

// ─── Platform icon mapping ──────────────────────────────────────

const PLATFORM_ICONS: Record<
  ContentPlatform,
  React.ComponentType<{ className?: string }>
> = {
  instagram: IconBrandInstagram,
  x: IconBrandX,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  newsletter: IconMail,
  website: IconWorld,
  other: IconDots,
};

const ALL_PLATFORMS: ContentPlatform[] = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
  "newsletter",
  "website",
  "other",
];

// ─── Component ──────────────────────────────────────────────────

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  onCreate: (input: CreateCampaignInput) => void;
  onUpdate?: (id: string, updates: Partial<Campaign>) => void;
}

export function CampaignForm({
  open,
  onOpenChange,
  campaign,
  onCreate,
  onUpdate,
}: CampaignFormProps) {
  const isEditing = !!campaign;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState<ContentPlatform[]>([]);

  // Reset form when dialog opens or campaign changes
  useEffect(() => {
    if (open) {
      if (campaign) {
        setName(campaign.name);
        setDescription(campaign.description);
        setObjective(campaign.objective);
        setStartDate(campaign.startDate?.split("T")[0] ?? "");
        setEndDate(campaign.endDate?.split("T")[0] ?? "");
        setPlatforms([...campaign.platforms]);
      } else {
        setName("");
        setDescription("");
        setObjective("");
        setStartDate("");
        setEndDate("");
        setPlatforms([]);
      }
    }
  }, [open, campaign]);

  function togglePlatform(platform: ContentPlatform) {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && onUpdate && campaign) {
      onUpdate(campaign.id, {
        name: name.trim(),
        description: description.trim(),
        objective: objective.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        platforms,
      });
    } else {
      onCreate({
        name: name.trim(),
        description: description.trim(),
        objective: objective.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        platforms,
        contentPillars: [],
      });
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Campaign" : "New Campaign"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your campaign details below."
              : "Fill in the details to create a new campaign."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Summer Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-desc">Description</Label>
            <Input
              id="campaign-desc"
              placeholder="Brief description of this campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Objective */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-objective">Objective</Label>
            <Textarea
              id="campaign-objective"
              placeholder="What do you want to achieve with this campaign?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="campaign-start">Start Date</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="campaign-end">End Date</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Platforms multi-select */}
          <div className="flex flex-col gap-2">
            <Label>Platforms</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_PLATFORMS.map((platform) => {
                const Icon = PLATFORM_ICONS[platform];
                const isSelected = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "flex items-center gap-1.5 border px-2 py-1.5 text-[11px] transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {PLATFORM_LABELS[platform]}
                    </span>
                  </button>
                );
              })}
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
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
