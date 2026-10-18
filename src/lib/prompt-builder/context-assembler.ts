import type { BrandKit } from "@/types/brand";
import type { Campaign } from "@/types/campaign";
import type { BrandMemory } from "@/types/memory";
import type { Frame } from "@/types/storyboard";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/types/common";

export interface PromptContext {
  brand: BrandKit;
  campaign?: Campaign;
  frame?: Frame;
  memories?: BrandMemory[];
  useMcp?: boolean;
}

/**
 * Assembles the full brand context block used at the top of every prompt.
 * Includes vault sections, campaign info, and relevant brand memories.
 *
 * When `useMcp` is true, emits a lightweight prompt that instructs Claude
 * to pull brand context via MCP tools instead of injecting the full vault.
 */
export function assembleBrandContext(ctx: PromptContext): string {
  if (ctx.useMcp) {
    return assembleMcpContext(ctx);
  }

  const parts: string[] = [];

  // ─── Brand overview ──────────────────────────────────────
  parts.push(`# Brand: ${ctx.brand.name}`);
  if (ctx.brand.description) {
    parts.push(ctx.brand.description);
  }

  // ─── Vault sections ──────────────────────────────────────
  for (const section of ctx.brand.sections) {
    parts.push(`\n## ${section.label}`);
    if (section.kind === "document") {
      parts.push(section.content.trim() || "_(no content yet)_");
    } else if (section.kind === "list") {
      if (section.items.length > 0) {
        for (const item of section.items) {
          parts.push(`### ${item.title}`);
          parts.push(item.content);
          if (item.metadata && Object.keys(item.metadata).length > 0) {
            const meta = Object.entries(item.metadata)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ");
            parts.push(`_${meta}_`);
          }
        }
      } else {
        parts.push("_(no items yet)_");
      }
    }
  }

  // ─── Campaign context ────────────────────────────────────
  if (ctx.campaign) {
    parts.push(`\n## Active Campaign: ${ctx.campaign.name}`);
    if (ctx.campaign.description) {
      parts.push(ctx.campaign.description);
    }
    if (ctx.campaign.objective) {
      parts.push(`**Objective:** ${ctx.campaign.objective}`);
    }
    if (ctx.campaign.platforms.length > 0) {
      parts.push(
        `**Platforms:** ${ctx.campaign.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")}`
      );
    }
    if (ctx.campaign.contentPillars.length > 0) {
      parts.push(
        `**Content Pillars:** ${ctx.campaign.contentPillars.join(", ")}`
      );
    }
  }

  // ─── Brand memories (sorted by importance) ────────────────
  if (ctx.memories && ctx.memories.length > 0) {
    parts.push(`\n## Brand Memory (Past Learnings & Preferences)`);
    const sorted = [...ctx.memories].sort(
      (a, b) => b.importance - a.importance
    );
    for (const mem of sorted) {
      const typeLabel =
        mem.type === "preference"
          ? "Preference"
          : mem.type === "rejection"
            ? "Rejection"
            : mem.type === "approval"
              ? "Approval"
              : mem.type === "feedback"
                ? "Feedback"
                : "Style";
      parts.push(`- **[${typeLabel}]** ${mem.title}: ${mem.content}`);
    }
  }

  return parts.join("\n");
}

/**
 * Assembles a lightweight MCP-aware prompt that instructs Claude to use
 * the Brand Brain tools to pull context, search memories, and log feedback.
 */
function assembleMcpContext(ctx: PromptContext): string {
  const brandId = ctx.brand.id;
  const parts: string[] = [];

  parts.push(`# Brand: ${ctx.brand.name}`);
  if (ctx.brand.description) {
    parts.push(ctx.brand.description);
  }

  parts.push(`\n## Brand Brain (MCP Tools Available)`);
  parts.push(
    `You have access to the Brand Brain — a semantic memory system for this brand. ` +
      `Use these tools to ground your output in brand knowledge and past learnings.`
  );
  parts.push(`\nBefore generating content, you MUST:`);
  parts.push(
    `1. Call \`get_brand_context\` with brandId "${brandId}" to load the full brand voice, style guide, and identity`
  );
  parts.push(
    `2. Call \`recall\` with brandId "${brandId}" and a query describing the content task to find relevant past learnings, preferences, and rejections`
  );

  if (ctx.campaign) {
    parts.push(
      `3. Call \`get_campaign\` with campaignId "${ctx.campaign.id}" to get campaign objectives and content pillars`
    );
  }

  parts.push(
    `${ctx.campaign ? "4" : "3"}. If generating for a specific platform, call \`get_platform_specs\` to get character limits and format rules`
  );
  parts.push(
    `${ctx.campaign ? "5" : "4"}. Optionally call \`get_approved_content\` with brandId "${brandId}" to see examples of previously approved content`
  );

  parts.push(`\n## Memory Rules`);
  parts.push(
    `- **Rejection memories**: NEVER repeat patterns that were previously rejected`
  );
  parts.push(
    `- **Preference memories**: ALWAYS follow stated preferences and brand voice`
  );
  parts.push(
    `- **Approved content**: Match the quality and style of past approved work`
  );
  parts.push(
    `- After the user approves or rejects content, call \`log_feedback\` to record it for future learning`
  );

  return parts.join("\n");
}

/**
 * Assembles the content request block for a frame.
 */
export function assembleFrameRequest(frame: Frame): string {
  const parts: string[] = [];
  parts.push(`# Content Request`);
  parts.push(`**Type:** ${CONTENT_TYPE_LABELS[frame.contentType]}`);
  if (frame.platform) {
    parts.push(`**Platform:** ${PLATFORM_LABELS[frame.platform]}`);
  }
  parts.push(`**Topic:** ${frame.title}`);
  if (frame.data.brief) {
    parts.push(`**Brief:** ${frame.data.brief}`);
  }
  if (frame.data.notes) {
    parts.push(`**Additional Notes:** ${frame.data.notes}`);
  }
  return parts.join("\n");
}
