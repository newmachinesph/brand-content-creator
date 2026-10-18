import type { ContentPlatform } from "./common";

export type CalendarEventStatus = "planned" | "in_progress" | "done" | "cancelled";

export type RecurrenceType = "daily" | "weekly" | "monthly";

export interface Recurrence {
  type: RecurrenceType;
  interval: number;
  endAfter?: number;
  endDate?: string;
}

export interface CalendarEvent {
  id: string;
  brandId: string;
  frameId?: string;
  campaignId?: string;
  title: string;
  platforms?: ContentPlatform[];
  postingTimes?: string[];
  scheduledAt: string;
  endDate?: string;
  recurrenceGroupId?: string;
  recurrenceData?: Recurrence;
  status: CalendarEventStatus;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventInput {
  title: string;
  platforms?: ContentPlatform[];
  postingTimes?: string[];
  scheduledAt: string;
  endDate?: string;
  recurrence?: Recurrence;
  frameId?: string;
  campaignId?: string;
}

export type CalendarView = "month" | "week" | "day";
