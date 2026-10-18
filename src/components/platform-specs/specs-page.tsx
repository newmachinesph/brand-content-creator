import { useEffect, useState, useCallback } from "react";
import {
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconDevices,
  IconSeeding,
  IconLoader2,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchAllPlatformSpecs } from "@/lib/db/platform-specs";
import type { PlatformSpec } from "@/types/platform-specs";
import type { ContentPlatform } from "@/types/common";

// ─── Platform config ─────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  string,
  { label: string; icon: Icon; color: string }
> = {
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    color: "#E1306C",
  },
  x: { label: "X", icon: IconBrandX, color: "#1DA1F2" },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin, color: "#0077B5" },
  facebook: { label: "Facebook", icon: IconBrandFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: IconBrandTiktok, color: "#000000" },
  youtube: { label: "YouTube", icon: IconBrandYoutube, color: "#FF0000" },
};

const PLATFORM_ORDER: ContentPlatform[] = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
];

// ─── Helpers ─────────────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return "--";
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ─── Platform Card ───────────────────────────────────────────────

function PlatformCard({
  platform,
  specs,
}: {
  platform: ContentPlatform;
  specs: PlatformSpec[];
}) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;

  const PlatformIcon = config.icon;

  return (
    <div className="border border-border bg-card">
      {/* Card header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{ color: config.color }}
        >
          <PlatformIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {config.label}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {specs.length} format{specs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Specs table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-medium">Format</th>
              <th className="px-4 py-2 font-medium">Dimensions</th>
              <th className="px-4 py-2 font-medium">Ratio</th>
              <th className="px-4 py-2 font-medium">Caption</th>
              <th className="px-4 py-2 font-medium">Hashtags</th>
              <th className="px-4 py-2 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((spec) => (
              <tr
                key={spec.id}
                className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2">
                  <span className="text-xs text-foreground">{spec.name}</span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {spec.width && spec.height
                      ? `${spec.width}x${spec.height}`
                      : "--"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {spec.aspectRatio ?? "--"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {spec.captionLimit
                      ? spec.captionLimit.toLocaleString()
                      : "--"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {spec.hashtagLimit ?? "--"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(spec.maxDuration)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rules summary */}
      {specs.some((s) => s.rules.length > 0) && (
        <div className="border-t border-border px-4 py-2.5">
          <div className="flex flex-wrap gap-1">
            {[
              ...new Set(specs.flatMap((s) => s.supportedFormats)),
            ].map((fmt) => (
              <Badge
                key={fmt}
                variant="secondary"
                className="text-[10px] px-1.5"
              >
                {fmt.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function SpecsPage() {
  const [specs, setSpecs] = useState<PlatformSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadSpecs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPlatformSpecs();
      setSpecs(data);
    } catch (err) {
      console.error("Failed to load platform specs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecs();

    // Listen for seed events from sidebar
    const handler = () => { loadSpecs(); };
    window.addEventListener("specs-seeded", handler);
    return () => window.removeEventListener("specs-seeded", handler);
  }, [loadSpecs]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const { getDefaultSpecsWithIds } = await import(
        "@/lib/platform-specs-defaults"
      );
      const { savePlatformSpec } = await import("@/lib/db/platform-specs");

      const defaults = getDefaultSpecsWithIds();
      for (const spec of defaults) {
        await savePlatformSpec(spec);
      }
      await loadSpecs();
      // Notify sidebar to reload
      window.dispatchEvent(new CustomEvent("specs-seeded"));
    } catch (err) {
      console.error("Failed to seed default specs:", err);
    } finally {
      setSeeding(false);
    }
  };

  // Group specs by platform
  const grouped = PLATFORM_ORDER.reduce<
    Record<ContentPlatform, PlatformSpec[]>
  >(
    (acc, platform) => {
      acc[platform] = specs.filter((s) => s.platform === platform);
      return acc;
    },
    {} as Record<ContentPlatform, PlatformSpec[]>,
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Loading platform specs...
        </p>
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <IconDevices className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-foreground">
            No platform specs found
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Seed the default specs for all major platforms to get started.
          </p>
        </div>
        <Button onClick={handleSeedDefaults} disabled={seeding}>
          {seeding ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconSeeding className="h-4 w-4" />
          )}
          {seeding ? "Seeding..." : "Seed Default Specs"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconDevices className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">
              Platform Specs
            </h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Reference specifications for all supported platforms and content
            formats.
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {PLATFORM_ORDER.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              const PIcon = config.icon;
              const count = grouped[platform]?.length ?? 0;
              return (
                <div
                  key={platform}
                  className="flex flex-col items-center gap-1.5 border border-border bg-card p-3"
                >
                  <PIcon className="h-4 w-4" style={{ color: config.color }} />
                  <span className="text-sm font-semibold text-foreground">
                    {count}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Platform cards */}
          <div className="grid gap-4">
            {PLATFORM_ORDER.map((platform) => {
              const platformSpecs = grouped[platform];
              if (!platformSpecs || platformSpecs.length === 0) return null;
              return (
                <PlatformCard
                  key={platform}
                  platform={platform}
                  specs={platformSpecs}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
