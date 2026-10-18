/** Identifies which AI prompt this template overrides */
export type PromptTemplateKey =
  | "content-copy"
  | "design-spec"
  | "brief-generation"
  | "hashtag-generation"
  | "brand-chat-system";

export const PROMPT_TEMPLATE_KEYS: {
  key: PromptTemplateKey;
  label: string;
  description: string;
}[] = [
  {
    key: "content-copy",
    label: "Content / Social Copy",
    description:
      "Used when generating social media captions and copy from a frame brief.",
  },
  {
    key: "design-spec",
    label: "Design Spec (Auto Design)",
    description:
      "Used by Design Studio Auto Design to generate Fabric.js canvas layouts.",
  },
  {
    key: "brief-generation",
    label: "Brief Generation",
    description:
      "Used to auto-generate a content brief from a frame title and campaign context.",
  },
  {
    key: "hashtag-generation",
    label: "Hashtag Generation",
    description:
      "Used to generate hashtag sets for a post based on topic and platform.",
  },
  {
    key: "brand-chat-system",
    label: "Brand Chat System Prompt",
    description:
      "The system prompt for the Brand Chat AI assistant.",
  },
];

export interface PromptTemplate {
  id: string;
  brandId: string;
  key: PromptTemplateKey;
  name: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Available placeholders that auto-resolve from brand context */
export interface PlaceholderInfo {
  placeholder: string;
  label: string;
  description: string;
  source: "brand" | "campaign" | "frame" | "platform";
}

export const AVAILABLE_PLACEHOLDERS: PlaceholderInfo[] = [
  // Brand
  {
    placeholder: "{{brand_name}}",
    label: "Brand Name",
    description: "The brand kit name",
    source: "brand",
  },
  {
    placeholder: "{{brand_description}}",
    label: "Brand Description",
    description: "The brand kit description",
    source: "brand",
  },
  {
    placeholder: "{{brand_voice}}",
    label: "Brand Voice",
    description: "Content from the Brand Voice section",
    source: "brand",
  },
  {
    placeholder: "{{visual_identity}}",
    label: "Visual Identity",
    description: "Content from the Visual Identity section",
    source: "brand",
  },
  {
    placeholder: "{{style_guide}}",
    label: "Style Guide",
    description: "Content from the Style Guide section",
    source: "brand",
  },
  {
    placeholder: "{{messaging_framework}}",
    label: "Messaging Framework",
    description: "Content from the Messaging Framework section",
    source: "brand",
  },
  {
    placeholder: "{{target_audiences}}",
    label: "Target Audiences",
    description: "Content from the Target Audiences section",
    source: "brand",
  },
  {
    placeholder: "{{content_examples}}",
    label: "Content Examples",
    description: "Content from the Content Examples section",
    source: "brand",
  },
  {
    placeholder: "{{anti_examples}}",
    label: "Anti-Examples",
    description: "Content from the Anti-Examples section",
    source: "brand",
  },
  {
    placeholder: "{{products}}",
    label: "Products",
    description: "Content from the Products section",
    source: "brand",
  },
  {
    placeholder: "{{brand_vault_full}}",
    label: "Full Brand Vault",
    description: "All brand vault sections combined",
    source: "brand",
  },
  // Campaign
  {
    placeholder: "{{campaign_name}}",
    label: "Campaign Name",
    description: "Active campaign name",
    source: "campaign",
  },
  {
    placeholder: "{{campaign_objective}}",
    label: "Campaign Objective",
    description: "Campaign objective / goal",
    source: "campaign",
  },
  {
    placeholder: "{{campaign_pillars}}",
    label: "Content Pillars",
    description: "Campaign content pillars (comma-separated)",
    source: "campaign",
  },
  {
    placeholder: "{{campaign_platforms}}",
    label: "Campaign Platforms",
    description: "Target platforms for the campaign",
    source: "campaign",
  },
  // Frame
  {
    placeholder: "{{frame_title}}",
    label: "Frame Title",
    description: "Current frame / content piece title",
    source: "frame",
  },
  {
    placeholder: "{{frame_brief}}",
    label: "Frame Brief",
    description: "The frame brief / description",
    source: "frame",
  },
  {
    placeholder: "{{frame_content_type}}",
    label: "Content Type",
    description: "Type of content (post, story, reel, etc.)",
    source: "frame",
  },
  // Platform
  {
    placeholder: "{{platform}}",
    label: "Platform",
    description: "Target platform name",
    source: "platform",
  },
];
