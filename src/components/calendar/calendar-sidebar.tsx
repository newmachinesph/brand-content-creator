import { useMemo, useState } from "react";
import {
  IconCalendarEvent,
  IconFilter,
  IconPoint,
  IconRepeat,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendar-store";
import { PLATFORM_LABELS } from "@/types/common";
import type { ContentPlatform } from "@/types/common";

// ─── Platform colors (match calendar-page) ──────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  x: "#1DA1F2",
  linkedin: "#0077B5",
  facebook: "#1877F2",
  tiktok: "#69C9D0",
  youtube: "#FF0000",
  newsletter: "#f97316",
  website: "#22c55e",
  other: "#71717a",
};

const FILTERABLE_PLATFORMS: ContentPlatform[] = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
];

// ─── Component ──────────────────────────────────────────────────

export function CalendarSidebar() {
  const events = useCalendarStore((s) => s.events);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  // Upcoming events (today and forward), sorted by date
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.scheduledAt.slice(0, 10) >= today)
      .filter((e) => !activePlatform || (e.platforms ?? []).includes(activePlatform as ContentPlatform))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 20);
  }, [events, activePlatform]);

  // Platform counts for filter badges
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const evt of events) {
      const ps = evt.platforms ?? ["other"];
      for (const p of ps) {
        counts[p] = (counts[p] || 0) + 1;
      }
    }
    return counts;
  }, [events]);

  function formatEventDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Platform filters */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5 pb-2">
          <IconFilter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Filter
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActivePlatform(null)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              !activePlatform
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All ({events.length})
          </button>
          {FILTERABLE_PLATFORMS.map((p) => {
            const count = platformCounts[p] || 0;
            if (count === 0) return null;
            const color = PLATFORM_COLORS[p];
            const isActive = activePlatform === p;
            return (
              <button
                key={p}
                onClick={() => setActivePlatform(isActive ? null : p)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                style={isActive ? { backgroundColor: color } : undefined}
              >
                {PLATFORM_LABELS[p].split(" ")[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="shrink-0 bg-sidebar-border" />

      {/* Upcoming events */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Upcoming
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-1">
          {upcoming.length === 0 ? (
            <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
              {activePlatform
                ? "No upcoming events for this platform."
                : "No upcoming events."}
            </p>
          ) : (
            upcoming.map((evt) => {
              const color =
                PLATFORM_COLORS[evt.platforms?.[0] ?? "other"] ?? "#71717a";
              const dateKey = evt.scheduledAt.slice(0, 10);
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedDate(dateKey)}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
                >
                  <IconPoint
                    className="mt-0.5 h-3 w-3 shrink-0"
                    style={{ color }}
                    fill={color}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-sidebar-foreground flex items-center gap-1">
                      {evt.recurrenceGroupId && (
                        <IconRepeat className="h-2.5 w-2.5 shrink-0 text-purple-400" />
                      )}
                      {evt.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatEventDate(evt.scheduledAt)}
                      {evt.endDate && ` – ${formatEventDate(evt.endDate)}`}
                      {evt.platforms && evt.platforms.length > 0 &&
                        ` · ${evt.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
