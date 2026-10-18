import type { CampaignStatus, ContentPlatform } from "./common";

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string;
  status: CampaignStatus;
  objective: string;
  startDate: string | null;
  endDate: string | null;
  platforms: ContentPlatform[];
  contentPillars: string[];
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CreateCampaignInput = Pick<
  Campaign,
  "name" | "description" | "objective" | "platforms" | "contentPillars"
> & {
  startDate?: string;
  endDate?: string;
};
