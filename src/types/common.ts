// ─── Shared enums used across multiple modules ─────────────────

export type ModuleId =
  | "dashboard"
  | "calendar"
  | "brand-vault"
  | "brand-memory"
  | "brand-chat"
  | "campaigns"
  | "storyboards"
  | "assets"
  | "templates"
  | "platform-specs"
  | "export"
  | "reporting"
  | "design-studio"
  | "activity-log"
  | "settings";

export type ContentType =
  | "social-post"
  | "email"
  | "blog-article"
  | "ad-copy"
  | "landing-page"
  | "video-script"
  | "custom";

export type ContentPlatform =
  | "instagram"
  | "x"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "newsletter"
  | "website"
  | "other";

export type FrameStatus =
  | "planned"
  | "briefed"
  | "in_production"
  | "review"
  | "approved"
  | "scheduled"
  | "published";

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type BriefType = "photo" | "video" | "copy" | "graphic";

export type MemoryType =
  | "preference"
  | "rejection"
  | "approval"
  | "feedback"
  | "learned_style";

export type MemorySource =
  | "manual"
  | "auto_rejection"
  | "auto_approval"
  | "import"
  | "vault_sync";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  "social-post": "Social Post",
  email: "Email",
  "blog-article": "Blog Article",
  "ad-copy": "Ad Copy",
  "landing-page": "Landing Page",
  "video-script": "Video Script",
  custom: "Custom",
};

export const PLATFORM_LABELS: Record<ContentPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  newsletter: "Newsletter",
  website: "Website",
  other: "Other",
};

export const CONTENT_TYPE_PLATFORMS: Partial<
  Record<ContentType, ContentPlatform[]>
> = {
  "social-post": ["instagram", "x", "linkedin", "facebook", "tiktok"],
  email: ["newsletter", "other"],
  "blog-article": ["website", "other"],
  "ad-copy": ["facebook", "instagram", "linkedin", "other"],
  "video-script": ["youtube", "tiktok", "instagram", "other"],
};

export const FRAME_STATUS_LABELS: Record<FrameStatus, string> = {
  planned: "Planned",
  briefed: "Briefed",
  in_production: "In Production",
  review: "Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};
