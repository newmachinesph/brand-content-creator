import { useState, useMemo, useEffect, useCallback } from "react";
import {
  IconTemplate,
  IconPlus,
  IconFile,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconTrash,
  IconSeeding,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplateStore } from "@/stores/template-store";
import { cn } from "@/lib/utils";
import type { ContentPlatform } from "@/types/common";

// ─── Constants ───────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social",
  email: "Email",
  blog: "Blog",
  ad: "Ad",
};

const CATEGORY_COLORS: Record<string, string> = {
  social: "bg-chart-4/20 text-chart-4",
  email: "bg-primary/20 text-primary",
  blog: "bg-chart-3/20 text-chart-3",
  ad: "bg-chart-5/20 text-chart-5",
};

const PLATFORM_OPTIONS: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "instagram", label: "Instagram", icon: IconBrandInstagram },
  { value: "x", label: "X", icon: IconBrandX },
  { value: "linkedin", label: "LinkedIn", icon: IconBrandLinkedin },
  { value: "facebook", label: "Facebook", icon: IconBrandFacebook },
  { value: "tiktok", label: "TikTok", icon: IconBrandTiktok },
  { value: "youtube", label: "YouTube", icon: IconBrandYoutube },
];

const PLATFORM_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(PLATFORM_OPTIONS.map((p) => [p.value, p.icon]));

// ─── Template Card ───────────────────────────────────────────────

function TemplateCard({
  template,
  onClick,
  onDelete,
}: {
  template: {
    id: string;
    name: string;
    category: string;
    platforms?: string[];
    data: Record<string, unknown>;
  };
  onClick: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="group flex cursor-pointer flex-col border border-border bg-card transition-colors hover:bg-muted/20 relative"
      onClick={onClick}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(template.id);
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded z-10"
      >
        <IconTrash className="h-3.5 w-3.5 text-destructive" />
      </button>

      <div className="flex h-20 items-center justify-center border-b border-border bg-muted/20">
        <IconTemplate className="h-6 w-6 text-muted-foreground/40" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-xs font-medium text-foreground truncate">
          {template.name}
        </p>

        {typeof template.data.description === "string" && template.data.description && (
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {String(template.data.description)}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5",
              CATEGORY_COLORS[template.category],
            )}
          >
            {CATEGORY_LABELS[template.category] ?? template.category}
          </Badge>

          {template.platforms?.map((p) => {
            const PIcon = PLATFORM_ICONS[p];
            if (!PIcon) return null;
            return (
              <Badge key={p} variant="outline" className="gap-1 text-[10px] px-1.5">
                <PIcon className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {((template.data as Record<string, unknown>)?.usageCount as number ?? 0) > 0
            ? `Used ${(template.data as Record<string, unknown>).usageCount} times`
            : "Not used yet"}
        </p>
      </div>
    </div>
  );
}

// ─── Template Editor Dialog ─────────────────────────────────────

function PlatformToggleGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (platforms: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((p) => p !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORM_OPTIONS.map((opt) => {
        const active = selected.includes(opt.value);
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TemplateEditorDialog({
  template,
  open,
  onOpenChange,
}: {
  template: {
    id: string;
    name: string;
    category: string;
    platforms?: string[];
    data: Record<string, unknown>;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [structure, setStructure] = useState("");

  // Sync local state when template changes
  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setPlatforms(template.platforms ?? []);
      setDescription(
        typeof template.data.description === "string" ? template.data.description : ""
      );
      setStructure(
        typeof template.data.structure === "string" ? template.data.structure : ""
      );
    }
  }, [template]);

  if (!template) return null;

  const handleSave = () => {
    updateTemplate(template.id, {
      name: name.trim(),
      category,
      platforms: platforms.length ? (platforms as ContentPlatform[]) : undefined,
      data: {
        ...template.data,
        description: description.trim(),
        structure: structure.trim(),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTemplate className="h-5 w-5 text-muted-foreground" />
            Edit Template
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <PlatformToggleGroup selected={platforms} onChange={setPlatforms} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Structure</Label>
            <Textarea
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder="Define the template structure..."
              rows={8}
              className="font-mono text-[12px] leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !category} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Template Dialog ──────────────────────────────────────

function CreateTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !category) return;
    addTemplate({
      name: name.trim(),
      category,
      platforms: platforms.length ? (platforms as ContentPlatform[]) : undefined,
      description: description.trim(),
    });
    setName("");
    setCategory("");
    setPlatforms([]);
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platforms (optional)</Label>
            <PlatformToggleGroup selected={platforms} onChange={setPlatforms} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !category} onClick={handleCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function TemplatePage() {
  const templates = useTemplateStore((s) => s.templates);
  const removeTemplate = useTemplateStore((s) => s.removeTemplate);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [viewerTemplate, setViewerTemplate] = useState<typeof templates[number] | null>(null);

  const handleSeedDefaults = useCallback(async () => {
    setSeeding(true);
    try {
      const { getDefaultTemplatesWithIds } = await import(
        "@/lib/template-defaults"
      );
      const { saveTemplate } = await import("@/lib/db/templates");

      const defaults = getDefaultTemplatesWithIds();
      for (const t of defaults) {
        await saveTemplate(t);
      }

      // Reload templates from DB
      const { useBrandStore } = await import("@/stores/brand-store");
      const brandId = useBrandStore.getState().activeBrandId;
      if (brandId) {
        // Force reload by clearing loaded state
        useTemplateStore.setState({ loadedBrandId: null });
        await useTemplateStore.getState().loadTemplates(brandId);
      }

      // Notify sidebar
      window.dispatchEvent(new CustomEvent("templates-seeded"));
    } catch (err) {
      console.error("Failed to seed default templates:", err);
    } finally {
      setSeeding(false);
    }
  }, []);

  // Listen for seed events from sidebar
  useEffect(() => {
    const handler = () => { handleSeedDefaults(); };
    window.addEventListener("templates-seed-trigger", handler);
    return () => window.removeEventListener("templates-seed-trigger", handler);
  }, [handleSeedDefaults]);

  // Listen for create events from sidebar
  useEffect(() => {
    const handler = () => { setDialogOpen(true); };
    window.addEventListener("template-create-trigger", handler);
    return () => window.removeEventListener("template-create-trigger", handler);
  }, []);

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return templates;
    return templates.filter((t) => t.category === categoryFilter);
  }, [templates, categoryFilter]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <IconTemplate className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
            Template Manager
          </h1>
          <span className="text-sm text-muted-foreground">
            ({templates.length})
          </span>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Category filter */}
      <div className="border-b border-border px-6 py-2.5">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="ad">Ad</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <IconFile className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No templates found
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Seed starter templates or create your own to streamline content creation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSeedDefaults} disabled={seeding}>
                {seeding ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconSeeding className="h-4 w-4" />
                )}
                {seeding ? "Seeding..." : "Seed Starter Templates"}
              </Button>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                size="default"
              >
                <IconPlus className="h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setViewerTemplate(template)}
                onDelete={removeTemplate}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <TemplateEditorDialog
        template={viewerTemplate}
        open={!!viewerTemplate}
        onOpenChange={(open) => { if (!open) setViewerTemplate(null); }}
      />
    </div>
  );
}
