import { useMemo } from "react";
import {
  IconCalendarEvent,
  IconFlag,
  IconLayoutBoard,
  IconBrain,
  IconPoint,
  IconRepeat,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useAppStore } from "@/stores/app-store";
import { PLATFORM_LABELS } from "@/types/common";
import type { ModuleId } from "@/types/common";

// ─── Platform colors ────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────

export function DashboardSidebar() {
  const events = useCalendarStore((s) => s.events);
  const campaigns = useCampaignStore((s) => s.campaigns);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const memories = useMemoryStore((s) => s.memories);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  // Next 5 upcoming calendar events
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.scheduledAt && e.scheduledAt.slice(0, 10) >= today)
      .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))
      .slice(0, 5);
  }, [events]);

  // Recent items (last 4 across campaigns + storyboards + memories)
  const recentItems = useMemo(() => {
    const items: { id: string; label: string; kind: string; color: string; date: string; module: ModuleId }[] = [];

    for (const c of campaigns) {
      items.push({
        id: c.id,
        label: c.name,
        kind: "Campaign",
        color: "#f97316",
        date: c.updatedAt,
        module: "campaigns",
      });
    }
    for (const s of storyboards) {
      items.push({
        id: s.id,
        label: s.name,
        kind: "Storyboard",
        color: "#3b82f6",
        date: s.updatedAt,
        module: "storyboards",
      });
    }
    for (const m of memories) {
      items.push({
        id: m.id,
        label: m.title,
        kind: "Memory",
        color: "#a855f7",
        date: m.updatedAt,
        module: "brand-memory",
      });
    }

    return items
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 4);
  }, [campaigns, storyboards, memories]);

  function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Upcoming events */}
      <div className="shrink-0 px-3 py-2">
        <button
          onClick={() => setActiveModule("calendar")}
          className="flex items-center gap-1.5 text-left group"
        >
          <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            Upcoming
          </span>
        </button>
      </div>

      <div className="shrink-0 px-2 pb-2">
        {upcoming.length === 0 ? (
          <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
            No upcoming events.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {upcoming.map((evt) => {
              const color = PLATFORM_COLORS[evt.platforms?.[0] ?? "other"] ?? "#71717a";
              return (
                <button
                  key={evt.id}
                  onClick={() => setActiveModule("calendar")}
                  className="flex items-start gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-sidebar-accent"
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
                      {formatShortDate(evt.scheduledAt)}
                      {evt.platforms && evt.platforms.length > 0 && ` · ${evt.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="shrink-0 bg-sidebar-border" />

      {/* Recent items */}
      <div className="shrink-0 px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Recent
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {recentItems.length === 0 ? (
          <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
            No recent items yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {recentItems.map((item) => {
              const Icon =
                item.kind === "Campaign"
                  ? IconFlag
                  : item.kind === "Storyboard"
                    ? IconLayoutBoard
                    : IconBrain;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.module)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-sidebar-foreground">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.kind} · {formatShortDate(item.date)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="shrink-0 bg-sidebar-border" />

      {/* Quick nav */}
      <div className="shrink-0 px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Quick Nav
        </span>
      </div>

      <div className="shrink-0 px-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {([
            { label: "Campaigns", module: "campaigns" as ModuleId, icon: IconFlag, color: "#f97316", count: campaigns.length },
            { label: "Storyboards", module: "storyboards" as ModuleId, icon: IconLayoutBoard, color: "#3b82f6", count: storyboards.length },
            { label: "Memories", module: "brand-memory" as ModuleId, icon: IconBrain, color: "#a855f7", count: memories.length },
            { label: "Calendar", module: "calendar" as ModuleId, icon: IconCalendarEvent, color: "#22c55e", count: events.length },
          ] as const).map((nav) => (
            <button
              key={nav.module}
              onClick={() => setActiveModule(nav.module)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <nav.icon className="h-3.5 w-3.5 shrink-0" style={{ color: nav.color }} />
              <span className="flex-1">{nav.label}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{nav.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
