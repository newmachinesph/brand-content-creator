export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "generated"
  | "exported";

export type ActivityEntityType =
  | "campaign"
  | "storyboard"
  | "frame"
  | "design"
  | "memory"
  | "calendar_event"
  | "template"
  | "export";

export interface ActivityLogEntry {
  id: string;
  brandId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  description: string;
  data: Record<string, unknown>;
  createdAt: string;
}
