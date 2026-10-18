import type { BriefType } from "./common";

export interface Brief {
  id: string;
  frameId: string;
  brandId: string;
  type: BriefType;
  status: "draft" | "generated" | "approved";
  generatedContent: string;
  promptUsed: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBriefInput {
  type: BriefType;
  frameId: string;
}
