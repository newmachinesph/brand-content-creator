import type { Frame } from "@/types/storyboard";
import {
  assembleBrandContext,
  assembleFrameRequest,
  type PromptContext,
} from "./context-assembler";

export function buildHashtagPrompt(
  ctx: PromptContext,
  frame: Frame,
  topic?: string
): string {
  const parts: string[] = [];

  parts.push(assembleBrandContext(ctx));
  parts.push(`\n---\n`);
  parts.push(assembleFrameRequest(frame));

  parts.push(`\n# Hashtag Research Task`);
  parts.push(
    `Research and generate a comprehensive hashtag strategy for this content.`
  );
  if (topic) {
    parts.push(`**Focus Topic:** ${topic}`);
  }

  parts.push(`\n# Requirements:`);
  parts.push(`Organize hashtags into three tiers:`);
  parts.push(`1. **Branded** (2-5) — unique to this brand, always used`);
  parts.push(`2. **Niche** (5-10) — specific to the topic/industry, moderate competition`);
  parts.push(`3. **Broad** (3-5) — high-volume, general discovery tags`);

  parts.push(`\n# Output Format`);
  parts.push(`### Branded Hashtags`);
  parts.push(`#tag1 #tag2 #tag3`);
  parts.push(`### Niche Hashtags`);
  parts.push(`#tag1 #tag2 #tag3 ...`);
  parts.push(`### Broad Hashtags`);
  parts.push(`#tag1 #tag2 #tag3`);
  parts.push(`### Recommended Combination (ready to paste)`);
  parts.push(`[All hashtags in one block, ordered by tier]`);
  parts.push(`\nOutput ONLY the hashtags. No preamble or explanation.`);

  return parts.join("\n");
}
