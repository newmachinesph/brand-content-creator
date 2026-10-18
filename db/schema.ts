import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  date,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";

// ─── EXISTING (unchanged) ────────────────────────────────────────

export const brandKits = pgTable("brand_kits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── MODULE 2: BRAND MEMORY ─────────────────────────────────────

export const brandMemories = pgTable(
  "brand_memories",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    type: text("type").notNull(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: jsonb("tags").notNull().default([]),
    importance: integer("importance").notNull().default(1),
    embedding: vector("embedding", { dimensions: 512 }),
    data: jsonb("data").notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("brand_memories_brand_id_idx").on(table.brandId),
    typeIdx: index("brand_memories_type_idx").on(table.type),
    embeddingIdx: index("brand_memories_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

// ─── MODULE 4: CAMPAIGNS ────────────────────────────────────────

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("draft"),
    objective: text("objective").notNull().default(""),
    startDate: date("start_date"),
    endDate: date("end_date"),
    platforms: jsonb("platforms").notNull().default([]),
    contentPillars: jsonb("content_pillars").notNull().default([]),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("campaigns_brand_id_idx").on(table.brandId),
    statusIdx: index("campaigns_status_idx").on(table.status),
  })
);

// ─── MODULE 5: STORYBOARDS (extended) ───────────────────────────

export const storyboards = pgTable(
  "storyboards",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    campaignId: text("campaign_id"),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("storyboards_brand_id_idx").on(table.brandId),
    campaignIdIdx: index("storyboards_campaign_id_idx").on(table.campaignId),
  })
);

// ─── MODULE 5 EXTENSION: FRAMES ─────────────────────────────────

export const frames = pgTable(
  "frames",
  {
    id: text("id").primaryKey(),
    storyboardId: text("storyboard_id").notNull(),
    brandId: text("brand_id").notNull(),
    campaignId: text("campaign_id"),
    title: text("title").notNull(),
    contentType: text("content_type").notNull(),
    platform: text("platform"),
    status: text("status").notNull().default("planned"),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
    publishedDate: timestamp("published_date", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    storyboardIdIdx: index("frames_storyboard_id_idx").on(table.storyboardId),
    brandIdIdx: index("frames_brand_id_idx").on(table.brandId),
    statusIdx: index("frames_status_idx").on(table.status),
    scheduledDateIdx: index("frames_scheduled_date_idx").on(
      table.scheduledDate
    ),
    platformIdx: index("frames_platform_idx").on(table.platform),
  })
);

// ─── MODULE 6: BRIEFS ───────────────────────────────────────────

export const briefs = pgTable(
  "briefs",
  {
    id: text("id").primaryKey(),
    frameId: text("frame_id").notNull(),
    brandId: text("brand_id").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull().default("draft"),
    generatedContent: text("generated_content").notNull().default(""),
    promptUsed: text("prompt_used").notNull().default(""),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    frameIdIdx: index("briefs_frame_id_idx").on(table.frameId),
  })
);

// ─── MODULE 7: ASSETS ───────────────────────────────────────────

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    frameId: text("frame_id"),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: real("duration"),
    version: integer("version").notNull().default(1),
    parentAssetId: text("parent_asset_id"),
    tags: jsonb("tags").notNull().default([]),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("assets_brand_id_idx").on(table.brandId),
    frameIdIdx: index("assets_frame_id_idx").on(table.frameId),
  })
);

// ─── MODULE 8: SOCIAL COPIES ────────────────────────────────────

export const socialCopies = pgTable(
  "social_copies",
  {
    id: text("id").primaryKey(),
    frameId: text("frame_id").notNull(),
    brandId: text("brand_id").notNull(),
    platform: text("platform").notNull(),
    variationIndex: integer("variation_index").notNull().default(0),
    caption: text("caption").notNull().default(""),
    hashtags: text("hashtags").notNull().default(""),
    cta: text("cta").notNull().default(""),
    characterCount: integer("character_count").notNull().default(0),
    status: text("status").notNull().default("draft"),
    promptUsed: text("prompt_used").notNull().default(""),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    frameIdIdx: index("social_copies_frame_id_idx").on(table.frameId),
    platformIdx: index("social_copies_platform_idx").on(table.platform),
  })
);

// ─── MODULE 9: HASHTAGS ─────────────────────────────────────────

export const hashtagSets = pgTable(
  "hashtag_sets",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    frameId: text("frame_id"),
    topic: text("topic").notNull(),
    platform: text("platform"),
    hashtags: jsonb("hashtags").notNull().default([]),
    isBrandLibrary: boolean("is_brand_library").notNull().default(false),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("hashtag_sets_brand_id_idx").on(table.brandId),
  })
);

// ─── MODULE 10: TEMPLATES ───────────────────────────────────────

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  brandId: text("brand_id"),
  name: text("name").notNull(),
  category: text("category").notNull(),
  platform: text("platform"),
  format: text("format"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── DESIGN STUDIO ─────────────────────────────────────────────

export const designs = pgTable(
  "designs",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    frameId: text("frame_id"),
    name: text("name").notNull(),
    canvasJson: jsonb("canvas_json").notNull().default({}),
    thumbnail: text("thumbnail"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    platform: text("platform"),
    format: text("format"),
    status: text("status").notNull().default("draft"),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("designs_brand_id_idx").on(table.brandId),
    frameIdIdx: index("designs_frame_id_idx").on(table.frameId),
  })
);

// ─── MODULE 12: PLATFORM SPECS ──────────────────────────────────

export const platformSpecs = pgTable(
  "platform_specs",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    format: text("format").notNull(),
    name: text("name").notNull(),
    width: integer("width"),
    height: integer("height"),
    aspectRatio: text("aspect_ratio"),
    maxFileSize: integer("max_file_size"),
    maxDuration: integer("max_duration"),
    captionLimit: integer("caption_limit"),
    hashtagLimit: integer("hashtag_limit"),
    supportedFormats: jsonb("supported_formats").notNull().default([]),
    rules: jsonb("rules").notNull().default([]),
    data: jsonb("data").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    platformFormatIdx: uniqueIndex("platform_specs_platform_format_idx").on(
      table.platform,
      table.format
    ),
  })
);

// ─── MODULE 13: CALENDAR EVENTS ─────────────────────────────────

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    frameId: text("frame_id"),
    campaignId: text("campaign_id"),
    title: text("title").notNull(),
    platform: text("platform"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    recurrenceGroupId: text("recurrence_group_id"),
    recurrenceData: jsonb("recurrence_data"),
    status: text("status").notNull().default("planned"),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("calendar_events_brand_id_idx").on(table.brandId),
    scheduledAtIdx: index("calendar_events_scheduled_at_idx").on(
      table.scheduledAt
    ),
  })
);

// ─── MODULE 14: EXPORTS ─────────────────────────────────────────

export const contentExports = pgTable("content_exports", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").notNull(),
  campaignId: text("campaign_id"),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  outputUrl: text("output_url"),
  checklist: jsonb("checklist").notNull().default([]),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── MODULE 15: ACTIVITY LOG ────────────────────────────────────

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("activity_log_brand_id_idx").on(table.brandId),
    actionIdx: index("activity_log_action_idx").on(table.action),
    createdAtIdx: index("activity_log_created_at_idx").on(table.createdAt),
  })
);

// ─── PROMPT TEMPLATES ──────────────────────────────────────────

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    template: text("template").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("prompt_templates_brand_id_idx").on(table.brandId),
    brandKeyIdx: uniqueIndex("prompt_templates_brand_key_idx").on(
      table.brandId,
      table.key
    ),
  })
);

// ─── MODULE 16: SETTINGS ────────────────────────────────────────

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
