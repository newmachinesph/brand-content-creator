import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  CalendarView,
} from "@/types/calendar";
import type { Recurrence } from "@/types/calendar";
import {
  fetchEventsByBrand,
  saveCalendarEvent,
  deleteCalendarEventDb,
  deleteEventsByGroup,
} from "@/lib/db/calendar";

// ─── Recurrence helpers ──────────────────────────────────────────

const MAX_OCCURRENCES = 52;

function computeRecurrenceDates(
  startDate: Date,
  recurrence: Recurrence,
): Date[] {
  const dates: Date[] = [];
  const maxCount = Math.min(recurrence.endAfter ?? MAX_OCCURRENCES, MAX_OCCURRENCES);
  const endLimit = recurrence.endDate ? new Date(recurrence.endDate + "T23:59:59") : null;

  for (let i = 0; i < maxCount; i++) {
    const d = new Date(startDate);
    if (recurrence.type === "daily") {
      d.setDate(d.getDate() + i * recurrence.interval);
    } else if (recurrence.type === "weekly") {
      d.setDate(d.getDate() + i * 7 * recurrence.interval);
    } else if (recurrence.type === "monthly") {
      d.setMonth(d.getMonth() + i * recurrence.interval);
    }
    if (endLimit && d > endLimit) break;
    dates.push(d);
  }
  return dates;
}

// ─── Store interface ─────────────────────────────────────────────

interface CalendarState {
  events: CalendarEvent[];
  loadedBrandId: string | null;
  view: CalendarView;
  selectedDate: string;

  loadEvents: (brandId: string) => Promise<void>;
  createEvent: (brandId: string, input: CreateCalendarEventInput) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  deleteEventGroup: (groupId: string) => void;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  immer((set, get) => ({
    events: [],
    loadedBrandId: null,
    view: "month",
    selectedDate: new Date().toISOString().slice(0, 10),

    loadEvents: async (brandId) => {
      if (get().loadedBrandId === brandId && get().events.length > 0) return;
      try {
        const rows = await fetchEventsByBrand(brandId);
        set((state) => {
          state.events = rows;
          state.loadedBrandId = brandId;
        });
      } catch (err) {
        console.error("Failed to load calendar events:", err);
      }
    },

    createEvent: (brandId, input) => {
      const now = new Date().toISOString();
      const baseDate = new Date(input.scheduledAt);

      // Recurring event → expand into individual rows
      if (input.recurrence) {
        const groupId = nanoid();
        const dates = computeRecurrenceDates(baseDate, input.recurrence);
        const newEvents: CalendarEvent[] = dates.map((d) => ({
          id: nanoid(),
          brandId,
          frameId: input.frameId,
          campaignId: input.campaignId,
          title: input.title,
          platforms: input.platforms,
          postingTimes: input.postingTimes,
          scheduledAt: d.toISOString(),
          endDate: input.endDate,
          recurrenceGroupId: groupId,
          recurrenceData: input.recurrence,
          status: "planned" as const,
          data: {},
          createdAt: now,
          updatedAt: now,
        }));
        set((state) => {
          state.events.push(...newEvents);
        });
        for (const evt of newEvents) {
          saveCalendarEvent(evt).catch(console.error);
        }
        return;
      }

      // Single / range event
      const event: CalendarEvent = {
        id: nanoid(),
        brandId,
        frameId: input.frameId,
        campaignId: input.campaignId,
        title: input.title,
        platforms: input.platforms,
        postingTimes: input.postingTimes,
        scheduledAt: input.scheduledAt,
        endDate: input.endDate,
        status: "planned",
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        state.events.push(event);
      });
      saveCalendarEvent(event).catch(console.error);
    },

    updateEvent: (id, updates) => {
      set((state) => {
        const event = state.events.find((e) => e.id === id);
        if (!event) return;
        Object.assign(event, updates, {
          updatedAt: new Date().toISOString(),
        });
      });
      const event = get().events.find((e) => e.id === id);
      if (event) saveCalendarEvent(event).catch(console.error);
    },

    deleteEvent: (id) => {
      set((state) => {
        state.events = state.events.filter((e) => e.id !== id);
      });
      deleteCalendarEventDb(id).catch(console.error);
    },

    deleteEventGroup: (groupId) => {
      set((state) => {
        state.events = state.events.filter(
          (e) => e.recurrenceGroupId !== groupId,
        );
      });
      deleteEventsByGroup(groupId).catch(console.error);
    },

    setView: (view) => {
      set((state) => {
        state.view = view;
      });
    },

    setSelectedDate: (date) => {
      set((state) => {
        state.selectedDate = date;
      });
    },
  }))
);
