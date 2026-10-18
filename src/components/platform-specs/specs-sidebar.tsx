import { useEffect, useMemo, useState } from "react";
import {
  IconDevices,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconSeeding,
  IconLoader2,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchAllPlatformSpecs } from "@/lib/db/platform-specs";
import type { PlatformSpec } from "@/types/platform-specs";

const PLATFORM_CONFIG: Record<string, { label: string; icon: Icon; color: string }> = {
  instagram: { label: "Instagram", icon: IconBrandInstagram, color: "#E1306C" },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#69C9D0" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

const PLATFORM_ORDER = ["instagram", "x", "linkedin", "facebook", "tiktok", "youtube"];

export function SpecsSidebar() {
  const [specs, setSpecs] = useState<PlatformSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadSpecs = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPlatformSpecs();
      setSpecs(data);
    } catch (err) {
      console.error("Failed to load specs for sidebar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecs();

    // Listen for seed events from the main page
    const handler = () => { loadSpecs(); };
    window.addEventListener("specs-seeded", handler);
    return () => window.removeEventListener("specs-seeded", handler);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    for (const spec of specs) {
      map[spec.platform] = (map[spec.platform] ?? 0) + 1;
    }
    return map;
  }, [specs]);

  const totalFormats = specs.length;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { getDefaultSpecsWithIds } = await import("@/lib/platform-specs-defaults");
      const { savePlatformSpec } = await import("@/lib/db/platform-specs");
      const defaults = getDefaultSpecsWithIds();
      for (const spec of defaults) {
        await savePlatformSpec(spec);
      }
      await loadSpecs();
      // Notify the main page to reload
      window.dispatchEvent(new CustomEvent("specs-seeded"));
    } catch (err) {
      console.error("Failed to seed specs:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : specs.length === 0 ? (
          <div className="space-y-3 text-center py-4">
            <IconDevices className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground">
              No platform specs. Seed defaults to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Summary
              </p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {totalFormats}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  total formats
                </span>
              </div>
            </div>

            <Separator className="my-3 bg-sidebar-border" />

            {/* Platforms */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Platforms
              </p>
              <div className="flex flex-col gap-1">
                {PLATFORM_ORDER.map((key) => {
                  const config = PLATFORM_CONFIG[key];
                  if (!config) return null;
                  const count = grouped[key] ?? 0;
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
              </div>
            </div>
          </>
        )}
      </div>

      {/* Seed button */}
      <div className="shrink-0 p-2">
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
          {seeding ? "Seeding..." : "Seed Default Specs"}
        </Button>
      </div>
    </div>
  );
}
