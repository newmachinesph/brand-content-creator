import type { ContentPlatform } from "./common";

export interface SocialCopy {
  id: string;
  frameId: string;
  brandId: string;
  platform: ContentPlatform;
  variationIndex: number;
  caption: string;
  hashtags: string;
  cta: string;
  characterCount: number;
  status: "draft" | "generated" | "approved";
  promptUsed: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
