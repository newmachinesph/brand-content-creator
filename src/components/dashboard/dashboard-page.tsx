import { useMemo } from "react";
import {
  IconLayoutDashboard,
  IconFlag,
  IconLayoutBoard,
  IconBrain,
  IconPhoto,
  IconDevices,
  IconArrowRight,
  IconClock,
  IconCalendar,
  IconChecklist,
  IconBrush,
  IconTimeline,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAppStore } from "@/stores/app-store";
import { PLATFORM_LABELS } from "@/types/common";
import type { ModuleId } from "@/types/common";

// ─── Stat Card ───────────────────────────────────────────────────

function StatCard({
  icon: StatIcon,
  label,
  value,
  color,
  onClick,
}: {
  icon: Icon;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 border border-border bg-card p-4 text-left",
        onClick && "transition-colors hover:bg-muted/30 cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between">
        <StatIcon className="h-5 w-5" style={{ color }} />
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Wrapper>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────

function QuickAction({
  icon: ActionIcon,
  label,
  description,
  onClick,
}: {
  icon: Icon;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30 group"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-background">
        <ActionIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <IconArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

// ─── Activity Item ───────────────────────────────────────────────

function ActivityItem({
  title,
  timestamp,
  type,
  onClick,
}: {
  title: string;
  timestamp: string;
  type: "campaign" | "storyboard" | "memory" | "calendar" | "general";
  onClick?: () => void;
}) {
  const typeColors: Record<string, string> = {
    campaign: "bg-primary/20 text-primary",
    storyboard: "bg-chart-4/20 text-chart-4",
    memory: "bg-chart-5/20 text-chart-5",
    calendar: "bg-cyan-500/20 text-cyan-400",
    general: "bg-muted text-muted-foreground",
  };

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 border border-border bg-card p-3",
        onClick && "group text-left transition-colors hover:bg-muted/30 cursor-pointer",
      )}
    >
      <div
        className={cn(
          "flex h-2 w-2 shrink-0 rounded-full",
          typeColors[type]?.split(" ")[0] ?? "bg-muted",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">{title}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <IconClock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{timestamp}</span>
      </div>
      {onClick && (
        <IconArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </Wrapper>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function DashboardPage() {
  const campaigns = useCampaignStore((s) => s.campaigns) ?? [];
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const storyboards = useStoryboardStore((s) => s.storyboards) ?? [];
  const setActiveStoryboard = useStoryboardStore((s) => s.setActiveStoryboard);
  const frames = useStoryboardStore((s) => s.frames) ?? [];
  const memories = useMemoryStore((s) => s.memories) ?? [];
  const calendarEvents = useCalendarStore((s) => s.events) ?? [];
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  const totalCampaigns = campaigns.length;
  const totalStoryboards = storyboards.length;
  const totalMemories = memories.length;
  const totalFrames = frames.length;

  // Today's tasks: filter events scheduled for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = useMemo(
    () =>
      calendarEvents.filter(
        (e) => e.scheduledAt.slice(0, 10) === todayStr && e.status !== "cancelled",
      ),
    [calendarEvents, todayStr],
  );
  const todayDoneCount = todayTasks.filter((e) => e.status === "done").length;

  // Upcoming calendar events (next 5 events from today)
  const upcomingEvents = useMemo(() => {
    const now = new Date().toISOString();
    return calendarEvents
      .filter((e) => e.scheduledAt >= now && e.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  // Build recent activity from real data, sorted by updatedAt
  const recentActivity = useMemo(() => {
    const items: {
      title: string;
      timestamp: string;
      rawDate: string;
      type: "campaign" | "storyboard" | "memory" | "calendar" | "general";
      onClick: () => void;
    }[] = [];

    for (const c of campaigns.slice(0, 4)) {
      items.push({
        title: `Campaign "${c.name}" - ${c.status}`,
        rawDate: c.updatedAt,
        timestamp: new Date(c.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        type: "campaign",
        onClick: () => {
          setActiveCampaign(c.id);
          setActiveModule("campaigns");
        },
      });
    }

    for (const sb of storyboards.slice(0, 3)) {
      items.push({
        title: `Storyboard "${sb.name}" updated`,
        rawDate: sb.updatedAt,
        timestamp: new Date(sb.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        type: "storyboard",
        onClick: () => {
          setActiveStoryboard(sb.id);
          setActiveModule("storyboards");
        },
      });
    }

    for (const m of memories.slice(0, 2)) {
      items.push({
        title: `Memory "${m.title}" added`,
        rawDate: m.updatedAt,
        timestamp: new Date(m.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        type: "memory",
        onClick: () => {
          setActiveModule("brand-memory");
        },
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
    );

    return items;
  }, [campaigns, storyboards, memories, setActiveCampaign, setActiveStoryboard, setActiveModule]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconLayoutDashboard className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Overview of your brand content workspace.
          </p>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={IconFlag}
            label="Total Campaigns"
            value={totalCampaigns}
            color="#f97316"
            onClick={() => setActiveModule("campaigns")}
          />
          <StatCard
            icon={IconLayoutBoard}
            label="Total Storyboards"
            value={totalStoryboards}
            color="#3b82f6"
            onClick={() => setActiveModule("storyboards")}
          />
          <StatCard
            icon={IconBrain}
            label="Total Memories"
            value={totalMemories}
            color="#a855f7"
            onClick={() => setActiveModule("brand-memory")}
          />
          <StatCard
            icon={IconPhoto}
            label="Total Frames"
            value={totalFrames}
            color="#22c55e"
            onClick={() => setActiveModule("storyboards")}
          />
        </div>

        {/* Today's Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconChecklist className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Today's Tasks
              </h2>
            </div>
            {todayTasks.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {todayDoneCount} of {todayTasks.length} done today
              </span>
            )}
          </div>

          {todayTasks.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {todayTasks.map((evt) => (
                <label
                  key={evt.id}
                  className="flex items-center gap-3 border border-border bg-card p-3 transition-colors hover:bg-muted/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={evt.status === "done"}
                    onChange={() => {
                      useCalendarStore.getState().updateEvent(evt.id, {
                        status: evt.status === "done" ? "planned" : "done",
                      });
                    }}
                    className="h-4 w-4 shrink-0 accent-primary cursor-pointer"
                  />
                  <span
                    className={cn(
                      "text-xs text-foreground",
                      evt.status === "done" &&
                        "line-through text-muted-foreground",
                    )}
                  >
                    {evt.title}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconChecklist className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No tasks scheduled for today
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickAction
              icon={IconFlag}
              label="Create Campaign"
              description="Start a new content campaign"
              onClick={() => setActiveModule("campaigns" as ModuleId)}
            />
            <QuickAction
              icon={IconLayoutBoard}
              label="New Storyboard"
              description="Plan visual content"
              onClick={() => setActiveModule("storyboards" as ModuleId)}
            />
            <QuickAction
              icon={IconBrain}
              label="Add Memory"
              description="Capture brand knowledge"
              onClick={() => setActiveModule("brand-memory" as ModuleId)}
            />
            <QuickAction
              icon={IconDevices}
              label="Browse Specs"
              description="View platform specifications"
              onClick={() => setActiveModule("platform-specs" as ModuleId)}
            />
            <QuickAction
              icon={IconBrush}
              label="Design Studio"
              description="Create and edit graphics"
              onClick={() => setActiveModule("design-studio" as ModuleId)}
            />
            <QuickAction
              icon={IconTimeline}
              label="Activity Log"
              description="View recent activity"
              onClick={() => setActiveModule("activity-log" as ModuleId)}
            />
          </div>
        </div>

        <Separator />

        {/* Upcoming Calendar Events */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">
                Upcoming Events
              </h2>
            </div>
            {calendarEvents.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveModule("calendar")}
                className="text-[11px] text-primary hover:underline"
              >
                View Calendar
              </button>
            )}
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {upcomingEvents.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setSelectedDate(evt.scheduledAt.slice(0, 10));
                    setActiveModule("calendar");
                  }}
                  className="group flex items-center gap-3 border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center border border-border bg-background">
                    <span className="text-[10px] uppercase leading-none text-muted-foreground">
                      {new Date(evt.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-bold leading-tight text-foreground">
                      {new Date(evt.scheduledAt).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {evt.title}
                    </p>
                    {evt.platforms && evt.platforms.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {evt.platforms
                          .map((p) => PLATFORM_LABELS[p])
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <IconArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconCalendar className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No upcoming events. Add events in the Calendar module.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {recentActivity.slice(0, 8).map((item, idx) => (
                <ActivityItem
                  key={idx}
                  title={item.title}
                  timestamp={item.timestamp}
                  type={item.type}
                  onClick={item.onClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border border-border bg-card p-6 text-center">
              <IconClock className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                No recent activity. Create a campaign or storyboard to get
                started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
