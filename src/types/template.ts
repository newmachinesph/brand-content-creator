import type { ContentPlatform } from "./common";

export interface Template {
  id: string;
  brandId?: string;
  name: string;
  category: string;
  platforms?: ContentPlatform[];
  format?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
