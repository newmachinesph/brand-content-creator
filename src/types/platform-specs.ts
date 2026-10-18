import type { ContentPlatform } from "./common";

export interface PlatformSpec {
  id: string;
  platform: ContentPlatform;
  format: string;
  name: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  maxFileSize?: number;
  maxDuration?: number;
  captionLimit?: number;
  hashtagLimit?: number;
  supportedFormats: string[];
  rules: string[];
  data: Record<string, unknown>;
  updatedAt: string;
}
