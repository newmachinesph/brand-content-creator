/**
 * Legacy prompt builder — kept for backward compatibility with the
 * StoryboardItem-based generation-panel. New code should use the
 * modular prompt builders in @/lib/prompt-builder/
 */
import type { BrandKit } from "@/types/brand";
import type { StoryboardItem } from "@/types/storyboard";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from "@/types/common";
import { assembleBrandContext } from "@/lib/prompt-builder/context-assembler";

export function buildContentPrompt(
  brand: BrandKit,
  item: StoryboardItem
): string {
  const parts: string[] = [];

  // Use the new context assembler for brand context (MCP-enabled)
  parts.push(assembleBrandContext({ brand, useMcp: true }));

  // Content request
  parts.push(`\n---\n`);
  parts.push(`# Content Request`);
  parts.push(`**Type:** ${CONTENT_TYPE_LABELS[item.contentType]}`);
  if (item.platform) {
    parts.push(`**Platform:** ${PLATFORM_LABELS[item.platform]}`);
  }
  parts.push(`**Topic:** ${item.title}`);
  parts.push(`**Brief:** ${item.brief}`);

  // Instructions
  parts.push(`\n# Instructions`);
  parts.push(
    `Generate the content based on the brand context above. Follow these rules strictly:`
  );
  parts.push(`- Match the brand voice and tone exactly`);
  parts.push(`- Follow the style guide and copy rules`);
  parts.push(`- Write for the target audience described above`);
  parts.push(`- Use the content examples as reference for quality and style`);
  parts.push(`- Avoid anything similar to the anti-examples`);
  parts.push(
    `- Tailor the format and length appropriately for the content type and platform`
  );
  parts.push(
    `\nOutput ONLY the final content, ready to publish. No preamble or explanation.`
  );

  return parts.join("\n");
}
