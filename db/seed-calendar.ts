/**
 * Seed calendar events with recurring + range events for testing.
 * Usage: bun run db/seed-calendar.ts
 */

import { createDb } from "./index";
import { calendarEvents, brandKits } from "./schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const db = createDb(DATABASE_URL);
const now = new Date();

async function run() {
  // Clear existing calendar events
  await db.delete(calendarEvents);
  console.log("Cleared calendar_events");

  // Get first brand
  const brands = await db.select().from(brandKits).limit(1);
  if (brands.length === 0) {
    console.error("No brands found. Create a brand first.");
    process.exit(1);
  }
  const brandId = brands[0].id;
  console.log(`Using brand: ${brands[0].name} (${brandId})\n`);

  // ─── Single-day events ──────────────────────────────────────
  const singles = [
    { title: "Product Launch Teaser", platform: "instagram", day: "2026-03-02" },
    { title: "Dev Tips Thread", platform: "x", day: "2026-03-04" },
    { title: "Team Culture Post", platform: "linkedin", day: "2026-03-05" },
    { title: "Behind the Scenes Reel", platform: "tiktok", day: "2026-03-06" },
    { title: "Community Q&A", platform: "facebook", day: "2026-03-10" },
    { title: "Feature Walkthrough", platform: "youtube", day: "2026-03-12" },
    { title: "User Spotlight Story", platform: "instagram", day: "2026-03-14" },
    { title: "Industry Insights Post", platform: "linkedin", day: "2026-03-18" },
    { title: "Quick Hack Video", platform: "tiktok", day: "2026-03-20" },
    { title: "Monthly Recap Thread", platform: "x", day: "2026-03-28" },
  ];

  for (const s of singles) {
    await db.insert(calendarEvents).values({
      id: nanoid(),
      brandId,
      title: s.title,
      platform: s.platform,
      scheduledAt: new Date(s.day + "T09:00:00"),
      status: "planned",
      data: {},
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`+ ${singles.length} single-day events`);

  // ─── Multi-day (range) events ───────────────────────────────
  await db.insert(calendarEvents).values({
    id: nanoid(),
    brandId,
    title: "Product Launch Campaign",
    platform: "instagram",
    scheduledAt: new Date("2026-03-09T09:00:00"),
    endDate: new Date("2026-03-11T23:59:00"),
    status: "planned",
    data: {},
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(calendarEvents).values({
    id: nanoid(),
    brandId,
    title: "Brand Awareness Week",
    platform: "facebook",
    scheduledAt: new Date("2026-03-23T09:00:00"),
    endDate: new Date("2026-03-27T23:59:00"),
    status: "planned",
    data: {},
    createdAt: now,
    updatedAt: now,
  });
  console.log("+ 2 multi-day (range) events");

  // ─── Recurring weekly events (4 occurrences) ────────────────
  const weeklyGroupId = nanoid();
  const weeklyRule = { type: "weekly", interval: 1, endAfter: 4 };
  for (let i = 0; i < 4; i++) {
    const d = new Date("2026-03-03T10:00:00");
    d.setDate(d.getDate() + i * 7);
    await db.insert(calendarEvents).values({
      id: nanoid(),
      brandId,
      title: "Weekly Standup Recap",
      platform: "linkedin",
      scheduledAt: d,
      recurrenceGroupId: weeklyGroupId,
      recurrenceData: weeklyRule,
      status: "planned",
      data: {},
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("+ 4 weekly recurring events (Weekly Standup Recap)");

  // ─── Recurring daily events (5 days) ────────────────────────
  const dailyGroupId = nanoid();
  const dailyRule = { type: "daily", interval: 1, endAfter: 5 };
  for (let i = 0; i < 5; i++) {
    const d = new Date("2026-03-16T08:00:00");
    d.setDate(d.getDate() + i);
    await db.insert(calendarEvents).values({
      id: nanoid(),
      brandId,
      title: "Daily Tip Series",
      platform: "x",
      scheduledAt: d,
      recurrenceGroupId: dailyGroupId,
      recurrenceData: dailyRule,
      status: "planned",
      data: {},
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("+ 5 daily recurring events (Daily Tip Series)");

  // ─── Recurring monthly events (3 months) ────────────────────
  const monthlyGroupId = nanoid();
  const monthlyRule = { type: "monthly", interval: 1, endAfter: 3 };
  for (let i = 0; i < 3; i++) {
    const d = new Date("2026-03-01T12:00:00");
    d.setMonth(d.getMonth() + i);
    await db.insert(calendarEvents).values({
      id: nanoid(),
      brandId,
      title: "Monthly Newsletter Promo",
      platform: "facebook",
      scheduledAt: d,
      recurrenceGroupId: monthlyGroupId,
      recurrenceData: monthlyRule,
      status: "planned",
      data: {},
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("+ 3 monthly recurring events (Monthly Newsletter Promo)");

  console.log("\nDone! 24 total calendar events seeded.");
  console.log("Restart the app to see them.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
