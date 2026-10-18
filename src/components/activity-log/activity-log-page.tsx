import { useEffect, useMemo, useCallback } from "react";
import {
  IconTimeline,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSparkles,
  IconPackageExport,
  IconCalendarEvent,
  IconFilter,
  IconMoodEmpty,
  IconLoader2,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useActivityStore } from "@/stores/activity-store";
import { useBrandStore } from "@/stores/brand-store";
import { useAppStore } from "@/stores/app-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useDesignStore } from "@/stores/design-store";
import { useCalendarStore } from "@/stores/calendar-store";
import type { ModuleId } from "@/types/common";
import type {
  ActivityAction,
  ActivityEntityType,
  ActivityLogEntry,
} from "@/types/activity-log";

// ── Action configuration ────────────────────────────────────────

const ACTION_CONFIG: Record<
  ActivityAction,
  { label: string; icon: Icon; color: string; bgColor: string }
> = {
  created: {
    label: "Created",
    icon: IconPlus,
    color: "text-green-500",
    bgColor: "bg-green-500",
  },
  updated: {
    label: "Updated",
    icon: IconPencil,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  deleted: {
    label: "Deleted",
    icon: IconTrash,
    color: "text-red-500",
    bgColor: "bg-red-500",
  },
  generated: {
    label: "Generated",
    icon: IconSparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  exported: {
    label: "Exported",
    icon: IconPackageExport,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
  },
};

// ── Entity type labels ──────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<ActivityEntityType, string> = {
  campaign: "Campaign",
  storyboard: "Storyboard",
  frame: "Frame",
  design: "Design",
  memory: "Memory",
  calendar_event: "Calendar Event",
  template: "Template",
  export: "Export",
};

// ── Filter options ──────────────────────────────────────────────

const ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "generated", label: "Generated" },
  { value: "exported", label: "Exported" },
];

const ENTITY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "campaign", label: "Campaign" },
  { value: "storyboard", label: "Storyboard" },
  { value: "frame", label: "Frame" },
  { value: "design", label: "Design" },
  { value: "memory", label: "Memory" },
  { value: "calendar_event", label: "Calendar Event" },
  { value: "template", label: "Template" },
  { value: "export", label: "Export" },
];

// ── Helpers ─────────────────────────────────────────────────────

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function groupByDate(
  entries: ActivityLogEntry[],
): { date: string; entries: ActivityLogEntry[] }[] {
  const groups = new Map<string, ActivityLogEntry[]>();

  for (const entry of entries) {
    const dateKey = new Date(entry.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(dateKey, [entry]);
    }
  }

  return Array.from(groups.entries()).map(([date, entries]) => ({
    date,
    entries,
  }));
}

// ── Entity navigation helper ────────────────────────────────────

function useEntityNavigation() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const setActiveStoryboard = useStoryboardStore((s) => s.setActiveStoryboard);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);

  return useCallback(
    (entityType: ActivityEntityType, entityId: string, data?: Record<string, unknown>) => {
      const moduleMap: Partial<Record<ActivityEntityType, ModuleId>> = {
        campaign: "campaigns",
        storyboard: "storyboards",
        frame: "storyboards",
        design: "design-studio",
        memory: "brand-memory",
        calendar_event: "calendar",
        template: "templates",
      };

      const target = moduleMap[entityType];
      if (!target) return;

      // Set entity-specific context before navigating
      if (entityType === "campaign") setActiveCampaign(entityId);
      if (entityType === "storyboard" || entityType === "frame") {
        const sbId = entityType === "frame" ? (data?.storyboardId as string | undefined) : entityId;
        if (sbId) setActiveStoryboard(sbId);
      }
      if (entityType === "design") setActiveDesign(entityId);
      if (entityType === "calendar_event" && data?.scheduledAt) {
        setSelectedDate((data.scheduledAt as string).slice(0, 10));
      }

      setActiveModule(target);
    },
    [setActiveModule, setActiveCampaign, setActiveStoryboard, setActiveDesign, setSelectedDate],
  );
}

// ── Timeline Entry Component ────────────────────────────────────

function TimelineEntry({ entry }: { entry: ActivityLogEntry }) {
  const actionConfig = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.created;
  const ActionIcon = actionConfig.icon;
  const { time } = formatTimestamp(entry.createdAt);
  const entityLabel = ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType;
  const navigateToEntity = useEntityNavigation();

  const canNavigate = entry.entityType !== "export" && !!entry.entityId;

  return (
    <div className="group relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="absolute top-5 left-[15px] bottom-0 w-px bg-border group-last:hidden" />

      {/* Action icon dot */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card",
        )}
      >
        <ActionIcon className={cn("h-3.5 w-3.5", actionConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-between gap-3 pt-1 min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs text-foreground leading-relaxed">
            {entry.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{time}</span>
            {canNavigate && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => navigateToEntity(entry.entityType, entry.entityId!, entry.data)}
                title={`Go to ${entityLabel}`}
              >
                <IconExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Entity type badge — clickable */}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[11px] capitalize",
            canNavigate && "cursor-pointer hover:bg-muted/50 transition-colors",
          )}
          onClick={canNavigate ? () => navigateToEntity(entry.entityType, entry.entityId!, entry.data) : undefined}
        >
          {entityLabel}
        </Badge>
      </div>
    </div>
  );
}

// ── Skeleton Loader ─────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/4 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-5 w-20 rounded bg-muted animate-pulse shrink-0 mt-1" />
        </div>
      ))}
    </div>
  );
}

// ── Filters Bar ─────────────────────────────────────────────────

interface ActivityFilters {
  startDate?: string;
  endDate?: string;
  action?: string;
  entityType?: string;
}

function FiltersBar({
  filters,
  onFilterChange,
}: {
  filters: ActivityFilters;
  onFilterChange: (filters: Partial<ActivityFilters>) => void;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <IconFilter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Filters</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Start date */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">
            Start Date
          </Label>
          <Input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
          />
        </div>

        {/* End date */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">End Date</Label>
          <Input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
          />
        </div>

        {/* Action type */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">Action</Label>
          <Select
            value={filters.action ?? "all"}
            onValueChange={(v) =>
              onFilterChange({ action: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity type */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">
            Entity Type
          </Label>
          <Select
            value={filters.entityType ?? "all"}
            onValueChange={(v) =>
              onFilterChange({ entityType: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export function ActivityLogPage() {
  const entries = useActivityStore((s) => s.entries);
  const loading = useActivityStore((s) => s.loading);
  const filters = useActivityStore((s) => s.filters);
  const loadEntries = useActivityStore((s) => s.loadEntries);
  const setFilters = useActivityStore((s) => s.setFilters);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  // Load entries when brand or filters change
  useEffect(() => {
    if (activeBrandId) {
      loadEntries(activeBrandId);
    }
  }, [activeBrandId, loadEntries, filters]);

  const handleFilterChange = useCallback(
    (update: Partial<typeof filters>) => {
      setFilters(update);
    },
    [setFilters],
  );

  // Group entries by date for the timeline
  const groupedEntries = useMemo(() => groupByDate(entries), [entries]);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconTimeline className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">
              Activity Log
            </h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            A chronological record of all actions performed across your brand
            workspace.
          </p>
        </div>

        <Separator />

        {/* Filters */}
        <FiltersBar filters={filters} onFilterChange={handleFilterChange} />

        <Separator />

        {/* Timeline */}
        {loading ? (
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Loading activity...
              </span>
            </div>
            <TimelineSkeleton />
          </div>
        ) : groupedEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-border bg-card p-10 text-center">
            <IconMoodEmpty className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No activity recorded yet
              </p>
              <p className="text-xs text-muted-foreground">
                Actions like creating campaigns, generating content, and
                exporting designs will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-2">
                  <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.date}
                  </span>
                </div>

                {/* Entries for this date */}
                <div className="border border-border bg-card p-4">
                  {group.entries.map((entry) => (
                    <TimelineEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
