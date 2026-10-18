import { eq } from "drizzle-orm";
import { calendarEvents } from "../../../db/schema";
import { getDb } from "./connection";
import type { CalendarEvent } from "@/types/calendar";
import type { ContentPlatform } from "@/types/common";

/** Parse platform column — handles both legacy single string and new JSON array */
function parsePlatforms(raw: string | null | undefined): ContentPlatform[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ContentPlatform[];
  } catch {
    // Legacy single-platform string
    return [raw as ContentPlatform];
  }
  return [raw as ContentPlatform];
}

export async function fetchEventsByBrand(
  brandId: string
): Promise<CalendarEvent[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.brandId, brandId))
    .orderBy(calendarEvents.scheduledAt);

  return rows.map((r) => {
    const data = (r.data ?? {}) as Record<string, unknown>;
    const postingTimes = Array.isArray(data.postingTimes)
      ? (data.postingTimes as string[])
      : undefined;
    return {
      id: r.id,
      brandId: r.brandId,
      frameId: r.frameId ?? undefined,
      campaignId: r.campaignId ?? undefined,
      title: r.title,
      platforms: parsePlatforms(r.platform),
      postingTimes,
      scheduledAt: r.scheduledAt.toISOString(),
      endDate: r.endDate ? r.endDate.toISOString() : undefined,
      recurrenceGroupId: r.recurrenceGroupId ?? undefined,
      recurrenceData: (r.recurrenceData as CalendarEvent["recurrenceData"]) ?? undefined,
      status: r.status as CalendarEvent["status"],
      data,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function saveCalendarEvent(event: CalendarEvent): Promise<void> {
  const db = getDb();
  await db
    .insert(calendarEvents)
    .values({
      id: event.id,
      brandId: event.brandId,
      frameId: event.frameId ?? null,
      campaignId: event.campaignId ?? null,
      title: event.title,
      platform: event.platforms && event.platforms.length > 0 ? JSON.stringify(event.platforms) : null,
      scheduledAt: new Date(event.scheduledAt),
      endDate: event.endDate ? new Date(event.endDate) : null,
      recurrenceGroupId: event.recurrenceGroupId ?? null,
      recurrenceData: event.recurrenceData ?? null,
      status: event.status,
      data: { ...event.data, postingTimes: event.postingTimes },
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    })
    .onConflictDoUpdate({
      target: calendarEvents.id,
      set: {
        title: event.title,
        platform: event.platforms && event.platforms.length > 0 ? JSON.stringify(event.platforms) : null,
        scheduledAt: new Date(event.scheduledAt),
        endDate: event.endDate ? new Date(event.endDate) : null,
        recurrenceGroupId: event.recurrenceGroupId ?? null,
        recurrenceData: event.recurrenceData ?? null,
        status: event.status,
        data: { ...event.data, postingTimes: event.postingTimes },
        updatedAt: new Date(event.updatedAt),
      },
    });
}

export async function deleteCalendarEventDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

export async function deleteEventsByGroup(groupId: string): Promise<void> {
  const db = getDb();
  await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.recurrenceGroupId, groupId));
}
