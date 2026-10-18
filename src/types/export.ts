export type ExportStatus = "pending" | "processing" | "completed" | "failed";

export interface ContentExport {
  id: string;
  brandId: string;
  campaignId?: string;
  type: string;
  status: ExportStatus;
  outputUrl?: string;
  checklist: { label: string; checked: boolean }[];
  data: Record<string, unknown>;
  createdAt: string;
}
