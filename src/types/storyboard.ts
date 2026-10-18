import type {
  ContentType,
  ContentPlatform,
  FrameStatus,
} from "./common";

// Re-export from common for backward compatibility
export type { ContentType, ContentPlatform } from "./common";
export {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_PLATFORMS,
} from "./common";

// ─── Legacy item status (kept for existing storyboard items) ────

export type ItemStatus =
  | "draft"
  | "generating"
  | "generated"
  | "approved"
  | "rejected";

export const STATUS_LABELS: Record<ItemStatus, string> = {
  draft: "Draft",
  generating: "Generating\u2026",
  generated: "Generated",
  approved: "Approved",
  rejected: "Rejected",
};

// ─── Storyboard Item (legacy, embedded in storyboard data JSONB) ─

export interface StoryboardItem {
  id: string;
  contentType: ContentType;
  platform?: ContentPlatform;
  title: string;
  brief: string;
  status: ItemStatus;
  generatedContent: string;
  promptUsed: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Storyboard ─────────────────────────────────────────────────

export type StoryboardStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "approved"
  | "published";

export interface Storyboard {
  id: string;
  brandId: string;
  campaignId?: string;
  name: string;
  description: string;
  status: StoryboardStatus;
  items: StoryboardItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Frame (relational entity, replaces StoryboardItem) ─────────

export interface Frame {
  id: string;
  storyboardId: string;
  brandId: string;
  campaignId?: string;
  title: string;
  contentType: ContentType;
  platform?: ContentPlatform;
  status: FrameStatus;
  scheduledDate?: string;
  publishedDate?: string;
  sortOrder: number;
  data: {
    brief?: string;
    generatedContent?: string;
    promptUsed?: string;
    notes?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export type CreateFrameInput = Pick<
  Frame,
  "title" | "contentType"
> & {
  platform?: ContentPlatform;
  brief?: string;
};
