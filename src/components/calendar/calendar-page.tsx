import { useEffect, useMemo, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconCalendar,
  IconX,
  IconRepeat,
  IconTrash,
  IconPencil,
  IconSpeakerphone,
  IconLayoutBoard,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendar-store";
import { useBrandStore } from "@/stores/brand-store";
import { useCampaignStore } from "@/stores/campaign-store";
import { useStoryboardStore } from "@/stores/storyboard-store";
import { useAppStore } from "@/stores/app-store";
import type { CalendarEvent, CalendarEventStatus, Recurrence, RecurrenceType } from "@/types/calendar";
import type { ContentPlatform } from "@/types/common";
import { PLATFORM_LABELS } from "@/types/common";
import type { CreateCalendarEventInput } from "@/types/calendar";

// ─── Platform colors ─────────────────────────────────────────────

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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SELECTABLE_PLATFORMS: ContentPlatform[] = [
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
  "youtube",
];

// ─── Helpers ─────────────────────────────────────────────────────

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return toDateKey(date) === toDateKey(now);
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// ─── Event Pill ──────────────────────────────────────────────────

function EventPill({ event }: { event: CalendarEvent }) {
  const color = PLATFORM_COLORS[event.platforms?.[0] ?? "other"] ?? "#71717a";
  const firstTime = event.postingTimes?.[0];
  return (
    <div
      className="flex items-center gap-1 truncate rounded-sm px-1 py-0.5 text-[10px] leading-tight"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {event.recurrenceGroupId && (
        <IconRepeat className="h-2.5 w-2.5 shrink-0 opacity-70" />
      )}
      {firstTime && (
        <span className="shrink-0 opacity-70">{formatTime12h(firstTime)}</span>
      )}
      <span className="truncate">{event.title}</span>
    </div>
  );
}

// ─── Day Cell ────────────────────────────────────────────────────

function DayCell({
  date,
  isCurrentMonth,
  events,
  isSelected,
  onClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const today = isToday(date);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-24 flex-col gap-0.5 border border-border/50 p-1 text-left transition-colors hover:bg-muted/30",
        !isCurrentMonth && "opacity-30",
        isSelected && "border-primary/50 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center text-[11px]",
          today && "bg-primary text-primary-foreground font-semibold",
          !today && "text-muted-foreground",
        )}
      >
        {date.getDate()}
      </span>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {events.slice(0, 2).map((evt) => (
          <EventPill key={evt.id} event={evt} />
        ))}
        {events.length > 2 && (
          <span className="px-1 text-[10px] text-muted-foreground">
            +{events.length - 2} more
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Side Panel ──────────────────────────────────────────────────

function DayDetailPanel({
  date,
  events,
  onClose,
  onEditEvent,
  onDeleteEvent,
  onDeleteSeries,
}: {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteSeries: (groupId: string) => void;
}) {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const frames = useStoryboardStore((s) => s.frames);
  const setActiveStoryboard = useStoryboardStore((s) => s.setActiveStoryboard);
  const setActiveFrame = useStoryboardStore((s) => s.setActiveFrame);
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  const d = new Date(date + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function navigateToCampaign(campaignId: string) {
    setActiveCampaign(campaignId);
    setActiveModule("campaigns");
  }

  function navigateToFrame(frameId: string) {
    // Find which storyboard the frame belongs to
    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      setActiveStoryboard(frame.storyboardId);
      setActiveFrame(frame.id);
      setActiveModule("storyboards");
    } else {
      // Frame may not be loaded yet; try finding storyboard from storyboards list
      const sb = storyboards.find((s) =>
        s.items?.some((item) => item.id === frameId)
      );
      if (sb) {
        setActiveStoryboard(sb.id);
        setActiveModule("storyboards");
      }
    }
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">Day Details</h3>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <IconX className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{formatted}</p>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No events scheduled for this day.
            </p>
          ) : (
            events.map((evt) => {
              const color =
                PLATFORM_COLORS[evt.platforms?.[0] ?? "other"] ?? "#71717a";
              const linkedCampaign = evt.campaignId
                ? campaigns.find((c) => c.id === evt.campaignId)
                : undefined;
              const linkedFrame = evt.frameId
                ? frames.find((f) => f.id === evt.frameId)
                : undefined;

              return (
                <div
                  key={evt.id}
                  className="border border-border bg-background p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate flex-1">
                      {evt.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 opacity-50 hover:opacity-100 hover:text-foreground"
                      onClick={() => onEditEvent(evt)}
                    >
                      <IconPencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 opacity-50 hover:opacity-100 hover:text-red-400"
                      onClick={() => onDeleteEvent(evt.id)}
                    >
                      <IconTrash className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-4">
                    {evt.platforms && evt.platforms.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {evt.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
                      </span>
                    )}
                    {evt.status !== "planned" && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0 text-[10px] font-medium",
                        evt.status === "in_progress" && "bg-amber-500/20 text-amber-400",
                        evt.status === "done" && "bg-green-500/20 text-green-400",
                        evt.status === "cancelled" && "bg-red-500/20 text-red-400",
                      )}>
                        {evt.status === "in_progress" ? "In Progress" : evt.status === "done" ? "Done" : "Cancelled"}
                      </span>
                    )}
                    {evt.endDate && (
                      <span className="rounded-full bg-blue-500/15 px-1.5 py-0 text-[10px] font-medium text-blue-400">
                        Multi-day
                      </span>
                    )}
                    {evt.recurrenceGroupId && (
                      <span className="flex items-center gap-0.5 rounded-full bg-purple-500/15 px-1.5 py-0 text-[10px] font-medium text-purple-400">
                        <IconRepeat className="h-2.5 w-2.5" />
                        Recurring
                      </span>
                    )}
                  </div>

                  {/* ── Posting times ──────────────────────── */}
                  {evt.postingTimes && evt.postingTimes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-4">
                      <IconClock className="h-3 w-3 text-muted-foreground" />
                      {evt.postingTimes.map((t, i) => (
                        <span
                          key={i}
                          className="rounded bg-muted px-1.5 py-0 text-[10px] font-medium text-foreground"
                        >
                          {formatTime12h(t)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Cross-module links ──────────────────── */}
                  {(linkedCampaign || linkedFrame) && (
                    <div className="flex flex-col gap-1 pl-4 pt-1">
                      {linkedCampaign && (
                        <button
                          type="button"
                          onClick={() => navigateToCampaign(linkedCampaign.id)}
                          className="group flex items-center gap-1.5 text-left transition-colors hover:text-primary"
                        >
                          <IconSpeakerphone className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span className="truncate text-[10px] text-muted-foreground group-hover:text-primary">
                            {linkedCampaign.name}
                          </span>
                          <IconArrowRight className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      )}
                      {linkedFrame && (
                        <button
                          type="button"
                          onClick={() => navigateToFrame(linkedFrame.id)}
                          className="group flex items-center gap-1.5 text-left transition-colors hover:text-primary"
                        >
                          <IconLayoutBoard className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span className="truncate text-[10px] text-muted-foreground group-hover:text-primary">
                            {linkedFrame.title}
                          </span>
                          <IconArrowRight className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      )}
                    </div>
                  )}

                  {evt.recurrenceGroupId && (
                    <div className="pl-4 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onDeleteSeries(evt.recurrenceGroupId!)}
                        className="text-[10px] text-red-400/70 hover:text-red-400 underline"
                      >
                        Delete all in series
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Recurrence preview helper ──────────────────────────────────

function recurrencePreview(
  recType: RecurrenceType,
  interval: number,
  endAfter: number,
): string {
  const unit = recType === "daily" ? "day" : recType === "weekly" ? "week" : "month";
  const freq = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
  return `${freq}, ${endAfter} time${endAfter !== 1 ? "s" : ""}`;
}

// ─── Add Event Dialog ────────────────────────────────────────────

function AddEventDialog({
  open,
  onOpenChange,
  initialDate,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: string;
  onAdd: (input: CreateCalendarEventInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [platforms, setPlatforms] = useState<ContentPlatform[]>([]);
  const [postingTimes, setPostingTimes] = useState<string[]>([]);

  // Multi-day
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState("");

  // Recurrence
  const [recType, setRecType] = useState<RecurrenceType | "none">("none");
  const [recInterval, setRecInterval] = useState(1);
  const [recEndAfter, setRecEndAfter] = useState(4);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDate(initialDate);
      setPlatforms([]);
      setPostingTimes([]);
      setIsMultiDay(false);
      setEndDate("");
      setRecType("none");
      setRecInterval(1);
      setRecEndAfter(4);
    }
  }, [open, initialDate]);

  function togglePlatform(p: ContentPlatform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  const handleSubmit = () => {
    if (!title.trim() || !date) return;

    const cleanTimes = postingTimes.filter((t) => t.trim() !== "");
    const input: CreateCalendarEventInput = {
      title: title.trim(),
      scheduledAt: new Date(date + "T09:00:00").toISOString(),
      platforms: platforms.length > 0 ? platforms : undefined,
      postingTimes: cleanTimes.length > 0 ? cleanTimes : undefined,
    };

    if (isMultiDay && endDate) {
      input.endDate = new Date(endDate + "T23:59:00").toISOString();
    }

    if (recType !== "none") {
      input.recurrence = {
        type: recType,
        interval: recInterval,
        endAfter: recEndAfter,
      };
    }

    onAdd(input);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Calendar Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Multi-day toggle + end date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => {
                  setIsMultiDay(e.target.checked);
                  if (!e.target.checked) setEndDate("");
                }}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-sm text-foreground">Multi-day event</span>
            </label>
            {isMultiDay && (
              <div className="space-y-1 pl-5">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_PLATFORMS.map((p) => {
                const active = platforms.includes(p);
                const color = PLATFORM_COLORS[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      active
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:border-foreground/30",
                    )}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posting Times */}
          <div className="space-y-2">
            <Label>Posting Times (optional)</Label>
            <div className="flex flex-col gap-1.5">
              {postingTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const updated = [...postingTimes];
                      updated[idx] = e.target.value;
                      setPostingTimes(updated);
                    }}
                    className="w-32 h-8 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setPostingTimes(postingTimes.filter((_, i) => i !== idx))}
                  >
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPostingTimes([...postingTimes, "09:00"])}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline text-left w-fit"
              >
                <IconClock className="h-3 w-3" />
                Add posting time
              </button>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select
              value={recType}
              onValueChange={(v) => setRecType(v as RecurrenceType | "none")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            {recType !== "none" && (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Every</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={recInterval}
                    onChange={(e) => setRecInterval(Math.max(1, +e.target.value))}
                    className="w-16 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">
                    {recType === "daily" ? "day(s)" : recType === "weekly" ? "week(s)" : "month(s)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Ends after</Label>
                  <Input
                    type="number"
                    min={2}
                    max={52}
                    value={recEndAfter}
                    onChange={(e) => setRecEndAfter(Math.max(2, Math.min(52, +e.target.value)))}
                    className="w-16 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">occurrences</span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {recurrencePreview(recType, recInterval, recEndAfter)}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !date}>
            {recType !== "none" ? `Add ${recEndAfter} Events` : "Add Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Event Dialog ──────────────────────────────────────────

const EVENT_STATUSES: { value: CalendarEventStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

function EditEventDialog({
  open,
  onOpenChange,
  event,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onSave: (id: string, updates: Partial<CalendarEvent>) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState<ContentPlatform[]>([]);
  const [postingTimes, setPostingTimes] = useState<string[]>([]);
  const [status, setStatus] = useState<CalendarEventStatus>("planned");

  useEffect(() => {
    if (event && open) {
      setTitle(event.title);
      setDate(event.scheduledAt.slice(0, 10));
      setEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
      setPlatforms(event.platforms ?? []);
      setPostingTimes(event.postingTimes ?? []);
      setStatus(event.status);
    }
  }, [event, open]);

  function togglePlatform(p: ContentPlatform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  const handleSubmit = () => {
    if (!event || !title.trim() || !date) return;

    const cleanTimes = postingTimes.filter((t) => t.trim() !== "");
    const updates: Partial<CalendarEvent> = {
      title: title.trim(),
      scheduledAt: new Date(date + "T09:00:00").toISOString(),
      platforms: platforms.length > 0 ? platforms : undefined,
      postingTimes: cleanTimes.length > 0 ? cleanTimes : undefined,
      status,
    };

    if (endDate) {
      updates.endDate = new Date(endDate + "T23:59:00").toISOString();
    } else {
      updates.endDate = undefined;
    }

    onSave(event.id, updates);
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date (optional)</Label>
            <Input
              type="date"
              value={endDate}
              min={date}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_PLATFORMS.map((p) => {
                const active = platforms.includes(p);
                const color = PLATFORM_COLORS[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      active
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:border-foreground/30",
                    )}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posting Times */}
          <div className="space-y-2">
            <Label>Posting Times (optional)</Label>
            <div className="flex flex-col gap-1.5">
              {postingTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const updated = [...postingTimes];
                      updated[idx] = e.target.value;
                      setPostingTimes(updated);
                    }}
                    className="w-32 h-8 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setPostingTimes(postingTimes.filter((_, i) => i !== idx))}
                  >
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPostingTimes([...postingTimes, "09:00"])}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline text-left w-fit"
              >
                <IconClock className="h-3 w-3" />
                Add posting time
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as CalendarEventStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !date}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Week View ──────────────────────────────────────────────────

function WeekView({ eventsByDate, selectedDate, onDayClick }: {
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedDate: string;
  onDayClick: (date: Date) => void;
}) {
  // Calculate the week containing selectedDate (Sun-Sat)
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(start.getDate() - day);
    return start;
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = toDateKey(day);
          const dayEvents = eventsByDate[key] ?? [];
          const today = isToday(day);
          const selected = key === selectedDate;

          return (
            <div key={key} className="flex flex-col gap-1">
              <button
                onClick={() => onDayClick(day)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-2 py-2 transition-colors",
                  selected && "bg-primary/10 border border-primary/30",
                  !selected && "hover:bg-muted/30"
                )}
              >
                <span className="text-[10px] uppercase text-muted-foreground">
                  {DAY_LABELS[day.getDay()]}
                </span>
                <span className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  today && "bg-primary text-primary-foreground font-semibold",
                  !today && "text-foreground"
                )}>
                  {day.getDate()}
                </span>
              </button>
              <div className="flex flex-col gap-0.5 min-h-[200px]">
                {dayEvents.map((evt) => (
                  <EventPill key={evt.id} event={evt} />
                ))}
                {dayEvents.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-4">&mdash;</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function CalendarPage() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const events = useCalendarStore((s) => s.events);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const createEvent = useCalendarStore((s) => s.createEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const deleteEventGroup = useCalendarStore((s) => s.deleteEventGroup);

  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (activeBrandId) {
      loadEvents(activeBrandId);
    }
  }, [activeBrandId, loadEvents]);

  // When selectedDate changes (e.g. sidebar click), navigate calendar to that month
  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(selectedDate + "T00:00:00");
    const y = d.getFullYear();
    const m = d.getMonth();
    setViewDate((prev) =>
      prev.year === y && prev.month === m ? prev : { year: y, month: m }
    );
  }, [selectedDate]);

  const days = useMemo(
    () => getMonthDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month],
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      const startKey = evt.scheduledAt.slice(0, 10);
      // Multi-day: place event on each day from start to end
      if (evt.endDate) {
        const start = new Date(startKey + "T00:00:00");
        const end = new Date(evt.endDate.slice(0, 10) + "T00:00:00");
        const cursor = new Date(start);
        while (cursor <= end) {
          const key = toDateKey(cursor);
          if (!map[key]) map[key] = [];
          map[key].push(evt);
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        if (!map[startKey]) map[startKey] = [];
        map[startKey].push(evt);
      }
    }
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const navigate = (delta: number) => {
    if (view === "week") {
      // In week view, navigate by 7 days via selectedDate
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + delta * 7);
      setSelectedDate(toDateKey(d));
    } else {
      setViewDate((prev) => {
        let month = prev.month + delta;
        let year = prev.year;
        if (month < 0) {
          month = 11;
          year -= 1;
        }
        if (month > 11) {
          month = 0;
          year += 1;
        }
        return { year, month };
      });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(toDateKey(date));
    setShowPanel(true);
  };

  const handleAddEvent = (input: CreateCalendarEventInput) => {
    if (!activeBrandId) return;
    createEvent(activeBrandId, input);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">
              Content Calendar
            </h1>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Month/Week navigation */}
        <div className="flex items-center justify-between border-b border-border px-6 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {monthLabel}
            </span>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <button
                onClick={() => setView("month")}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-sm",
                  view === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-sm",
                  view === "week"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Week
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(1)}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        {view === "month" ? (
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-px">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px">
                {days.map((day, idx) => {
                  const key = toDateKey(day.date);
                  return (
                    <DayCell
                      key={idx}
                      date={day.date}
                      isCurrentMonth={day.isCurrentMonth}
                      events={eventsByDate[key] ?? []}
                      isSelected={selectedDate === key}
                      onClick={() => handleDayClick(day.date)}
                    />
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <WeekView
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* Side panel */}
      {showPanel && selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setShowPanel(false)}
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent}
          onDeleteSeries={deleteEventGroup}
        />
      )}

      {/* Add event dialog */}
      <AddEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={selectedDate ?? toDateKey(new Date())}
        onAdd={handleAddEvent}
      />

      {/* Edit event dialog */}
      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={editingEvent}
        onSave={updateEvent}
      />
    </div>
  );
}
