import { useMemo, useEffect } from "react";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSparkles,
  IconPackageExport,
  IconFlag,
  IconLayoutBoard,
  IconFrame,
  IconPalette,
  IconBrain,
  IconCalendarEvent,
  IconTemplate,
  IconFileExport,
  IconFilter,
  IconFilterOff,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivityStore } from "@/stores/activity-store";
import { useBrandStore } from "@/stores/brand-store";
import type { ActivityAction, ActivityEntityType } from "@/types/activity-log";

// ── Action config ───────────────────────────────────────────────

const ACTION_CONFIG: Record<
  ActivityAction,
  { label: string; icon: Icon; color: string }
> = {
  created: { label: "Created", icon: IconPlus, color: "#22c55e" },
  updated: { label: "Updated", icon: IconPencil, color: "#3b82f6" },
  deleted: { label: "Deleted", icon: IconTrash, color: "#ef4444" },
  generated: { label: "Generated", icon: IconSparkles, color: "#a855f7" },
  exported: { label: "Exported", icon: IconPackageExport, color: "#f97316" },
};

const ENTITY_CONFIG: Record<
  ActivityEntityType,
  { label: string; icon: Icon; color: string }
> = {
  campaign: { label: "Campaign", icon: IconFlag, color: "#f97316" },
  storyboard: { label: "Storyboard", icon: IconLayoutBoard, color: "#3b82f6" },
  frame: { label: "Frame", icon: IconFrame, color: "#06b6d4" },
  design: { label: "Design", icon: IconPalette, color: "#ec4899" },
  memory: { label: "Memory", icon: IconBrain, color: "#a855f7" },
  calendar_event: { label: "Event", icon: IconCalendarEvent, color: "#22c55e" },
  template: { label: "Template", icon: IconTemplate, color: "#eab308" },
  export: { label: "Export", icon: IconFileExport, color: "#71717a" },
};

// ── Component ───────────────────────────────────────────────────

export function ActivitySidebar() {
  const entries = useActivityStore((s) => s.entries);
  const filters = useActivityStore((s) => s.filters);
  const setFilters = useActivityStore((s) => s.setFilters);
  const loadEntries = useActivityStore((s) => s.loadEntries);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  // Ensure entries are loaded
  useEffect(() => {
    if (activeBrandId) loadEntries(activeBrandId);
  }, [activeBrandId, loadEntries]);

  // Action counts
  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.action] = (counts[e.action] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  // Entity counts
  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.entityType] = (counts[e.entityType] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  const hasActiveFilters = !!(
    filters.action ||
    filters.entityType ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Total */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Summary
          </p>
          <div className="rounded-md bg-sidebar-accent/50 px-3 py-2.5">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {entries.length}
            </p>
            <p className="text-[11px] text-muted-foreground">
              total activities
            </p>
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Action */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Action
          </p>
          <div className="flex flex-col gap-0.5">
            {(Object.entries(ACTION_CONFIG) as [ActivityAction, typeof ACTION_CONFIG[ActivityAction]][]).map(
              ([key, config]) => {
                const count = actionCounts[key] ?? 0;
                const isActive = filters.action === key;
                const AIcon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFilters({ action: isActive ? undefined : key })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <AIcon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: config.color }}
                    />
                    <span className="flex-1 text-left">{config.label}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* By Entity */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            By Type
          </p>
          <div className="flex flex-col gap-0.5">
            {(Object.entries(ENTITY_CONFIG) as [ActivityEntityType, typeof ENTITY_CONFIG[ActivityEntityType]][]).map(
              ([key, config]) => {
                const count = entityCounts[key] ?? 0;
                if (count === 0) return null;
                const isActive = filters.entityType === key;
                const EIcon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFilters({
                        entityType: isActive ? undefined : key,
                      })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <EIcon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: config.color }}
                    />
                    <span className="flex-1 text-left">{config.label}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              },
            )}
            {Object.values(entityCounts).every((c) => c === 0) && (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                No activity yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Clear filters footer */}
      {hasActiveFilters && (
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() =>
              setFilters({
                action: undefined,
                entityType: undefined,
                startDate: undefined,
                endDate: undefined,
              })
            }
          >
            <IconFilterOff className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
