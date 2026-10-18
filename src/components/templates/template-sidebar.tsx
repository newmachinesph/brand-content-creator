import { useMemo, useState } from "react";
import {
  IconTemplate,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconSeeding,
  IconLoader2,
  IconPlus,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTemplateStore } from "@/stores/template-store";

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  social: { label: "Social", color: "text-chart-4" },
  email: { label: "Email", color: "text-primary" },
  blog: { label: "Blog", color: "text-chart-3" },
  ad: { label: "Ad", color: "text-chart-5" },
};

const PLATFORM_CONFIG: Record<string, { label: string; icon: Icon; color: string }> = {
  instagram: { label: "Instagram", icon: IconBrandInstagram, color: "#E1306C" },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#69C9D0" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

export function TemplateSidebar() {
  const templates = useTemplateStore((s) => s.templates);
  const [seeding, setSeeding] = useState(false);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    for (const t of templates) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
      if (t.platforms) {
        for (const p of t.platforms) {
          byPlatform[p] = (byPlatform[p] ?? 0) + 1;
        }
      }
    }

    return { byCategory, byPlatform };
  }, [templates]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { getDefaultTemplatesWithIds } = await import("@/lib/template-defaults");
      const { saveTemplate } = await import("@/lib/db/templates");
      const defaults = getDefaultTemplatesWithIds();
      for (const t of defaults) {
        await saveTemplate(t);
      }
      // Force reload
      const { useBrandStore } = await import("@/stores/brand-store");
      const brandId = useBrandStore.getState().activeBrandId;
      if (brandId) {
        useTemplateStore.setState({ loadedBrandId: null });
        await useTemplateStore.getState().loadTemplates(brandId);
      }
      window.dispatchEvent(new CustomEvent("templates-seeded"));
    } catch (err) {
      console.error("Failed to seed templates:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Summary */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Library
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {templates.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              templates
            </span>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Category */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Category
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const count = stats.byCategory[key] ?? 0;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <IconTemplate className={`h-4 w-4 shrink-0 ${info.color}`} />
                  <span className="flex-1 text-sidebar-foreground/70">{info.label}</span>
                  <span className="text-[12px] font-medium tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Platform */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Platform
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const count = stats.byPlatform[key] ?? 0;
              if (count === 0) return null;
              const PIcon = config.icon;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                >
                  <PIcon className="h-4 w-4 shrink-0" style={{ color: config.color }} />
                  <span className="flex-1 text-sidebar-foreground/70">{config.label}</span>
                  <span className="text-[12px] font-medium tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
            {Object.keys(stats.byPlatform).length === 0 && (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                No platform-specific templates.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 space-y-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconSeeding className="h-4 w-4" />
          )}
          {seeding ? "Seeding..." : "Seed Starter Templates"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("template-create-trigger"));
          }}
        >
          <IconPlus className="h-4 w-4" />
          Create Template
        </Button>
      </div>
    </div>
  );
}
