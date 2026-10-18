import type { BrandKit, BrandSection } from "@/types/brand";
import type { Campaign } from "@/types/campaign";
import type { Frame } from "@/types/storyboard";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/types/common";

// ── Context for placeholder resolution ──────────────────────────

export interface ResolverContext {
  brand: BrandKit;
  campaign?: Campaign;
  frame?: Frame;
  platform?: string;
}

// ── Section content extractors ──────────────────────────────────

function getSectionContent(
  brand: BrandKit,
  sectionId: string
): string {
  const section = brand.sections.find((s) => s.id === sectionId);
  if (!section) return "";

  if (section.kind === "document") {
    return section.content.trim();
  }

  if (section.kind === "list") {
    return section.items
      .map((item) => {
        let text = `### ${item.title}\n${item.content}`;
        if (item.metadata && Object.keys(item.metadata).length > 0) {
          const meta = Object.entries(item.metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
          text += `\n_${meta}_`;
        }
        return text;
      })
      .join("\n\n");
  }

  return "";
}

function getFullBrandVault(brand: BrandKit): string {
  return brand.sections
    .map((section) => {
      const header = `## ${section.label}`;
      if (section.kind === "document") {
        return `${header}\n${section.content.trim() || "_(no content yet)_"}`;
      }
      if (section.kind === "list") {
        if (section.items.length === 0) return `${header}\n_(no items yet)_`;
        return (
          header +
          "\n" +
          section.items
            .map((item) => {
              let text = `### ${item.title}\n${item.content}`;
              if (item.metadata && Object.keys(item.metadata).length > 0) {
                const meta = Object.entries(item.metadata)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" | ");
                text += `\n_${meta}_`;
              }
              return text;
            })
            .join("\n\n")
        );
      }
      return header;
    })
    .join("\n\n");
}

// ── Placeholder map builder ─────────────────────────────────────

function buildPlaceholderMap(ctx: ResolverContext): Record<string, string> {
  const map: Record<string, string> = {};
  const { brand, campaign, frame, platform } = ctx;

  // Brand placeholders
  map["brand_name"] = brand.name;
  map["brand_description"] = brand.description || "";
  map["brand_voice"] = getSectionContent(brand, "brand-voice");
  map["visual_identity"] = getSectionContent(brand, "visual-identity");
  map["style_guide"] = getSectionContent(brand, "style-guide");
  map["messaging_framework"] = getSectionContent(brand, "messaging-framework");
  map["target_audiences"] = getSectionContent(brand, "target-audiences");
  map["content_examples"] = getSectionContent(brand, "content-examples");
  map["anti_examples"] = getSectionContent(brand, "anti-examples");
  map["products"] = getSectionContent(brand, "products");
  map["brand_vault_full"] = getFullBrandVault(brand);

  // Also resolve any custom section by id: {{section:my-custom-section}}
  for (const section of brand.sections) {
    map[`section:${section.id}`] = getSectionContent(brand, section.id);
  }

  // Campaign placeholders
  map["campaign_name"] = campaign?.name ?? "";
  map["campaign_objective"] = campaign?.objective ?? "";
  map["campaign_pillars"] = campaign?.contentPillars?.join(", ") ?? "";
  map["campaign_platforms"] =
    campaign?.platforms?.map((p) => PLATFORM_LABELS[p] ?? p).join(", ") ?? "";

  // Frame placeholders
  map["frame_title"] = frame?.title ?? "";
  map["frame_brief"] = frame?.data?.brief ?? "";
  map["frame_content_type"] = frame
    ? CONTENT_TYPE_LABELS[frame.contentType] ?? frame.contentType
    : "";

  // Platform
  map["platform"] = platform
    ? PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform
    : frame?.platform
      ? PLATFORM_LABELS[frame.platform as keyof typeof PLATFORM_LABELS] ?? frame.platform
      : "";

  return map;
}

// ── Resolver ────────────────────────────────────────────────────

/**
 * Resolves all `{{placeholder}}` tokens in a template string using brand context.
 * Unknown placeholders are left as-is.
 */
export function resolveTemplate(
  template: string,
  ctx: ResolverContext
): string {
  const map = buildPlaceholderMap(ctx);

  return template.replace(/\{\{(\w[\w:.-]*)\}\}/g, (_match, key: string) => {
    const value = map[key];
    return value !== undefined ? value : `{{${key}}}`;
  });
}

/**
 * Returns a preview of what each placeholder resolves to for the current context.
 * Useful for showing in the template editor UI.
 */
export function previewPlaceholders(
  ctx: ResolverContext
): { placeholder: string; value: string }[] {
  const map = buildPlaceholderMap(ctx);
  return Object.entries(map)
    .filter(([key]) => !key.startsWith("section:"))
    .map(([key, value]) => ({
      placeholder: `{{${key}}}`,
      value: value.slice(0, 100) + (value.length > 100 ? "..." : ""),
    }));
}
