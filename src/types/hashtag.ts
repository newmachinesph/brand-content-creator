import type { ContentPlatform } from "./common";

export interface HashtagEntry {
  tag: string;
  tier: "branded" | "niche" | "broad";
}

export interface HashtagSet {
  id: string;
  brandId: string;
  frameId?: string;
  topic: string;
  platform?: ContentPlatform;
  hashtags: HashtagEntry[];
  isBrandLibrary: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
