import { eq, desc, and, gte, lte } from "drizzle-orm";
import { activityLog } from "../../../db/schema";
import { getDb } from "./connection";
import type { ActivityLogEntry } from "@/types/activity-log";

interface FetchActivityLogOptions {
  startDate?: string;
  endDate?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}

export async function fetchActivityLog(
  brandId: string,
  options?: FetchActivityLogOptions
): Promise<ActivityLogEntry[]> {
  const db = getDb();
  const limit = options?.limit ?? 100;

  const conditions = [eq(activityLog.brandId, brandId)];

  if (options?.startDate) {
    conditions.push(gte(activityLog.createdAt, new Date(options.startDate)));
  }
  if (options?.endDate) {
    conditions.push(lte(activityLog.createdAt, new Date(options.endDate)));
  }
  if (options?.action) {
    conditions.push(eq(activityLog.action, options.action));
  }
  if (options?.entityType) {
    conditions.push(eq(activityLog.entityType, options.entityType));
  }

  const rows = await db
    .select()
    .from(activityLog)
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const data = (r.data ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      brandId: r.brandId ?? "",
      action: r.action as ActivityLogEntry["action"],
      entityType: r.entityType as ActivityLogEntry["entityType"],
      entityId: r.entityId ?? undefined,
      description: (data.description as string) ?? "",
      data,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export async function logActivity(
  entry: ActivityLogEntry
): Promise<void> {
  const db = getDb();
  await db.insert(activityLog).values({
    id: entry.id,
    brandId: entry.brandId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    data: { ...entry.data, description: entry.description },
    createdAt: new Date(entry.createdAt),
  });
}
