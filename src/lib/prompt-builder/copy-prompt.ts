import type { ContentPlatform } from "@/types/common";
import type { Frame } from "@/types/storyboard";
import {
  assembleBrandContext,
  assembleFrameRequest,
  type PromptContext,
} from "./context-assembler";

const PLATFORM_LIMITS: Partial<
  Record<ContentPlatform, { caption: number; hashtags: number }>
> = {
  instagram: { caption: 2200, hashtags: 30 },
  x: { caption: 280, hashtags: 5 },
  linkedin: { caption: 3000, hashtags: 10 },
  facebook: { caption: 63206, hashtags: 10 },
  tiktok: { caption: 2200, hashtags: 10 },
  youtube: { caption: 5000, hashtags: 15 },
};

export function buildCopyPrompt(
  ctx: PromptContext,
  frame: Frame,
  variations: number = 3
): string {
  const parts: string[] = [];

  parts.push(assembleBrandContext(ctx));
  parts.push(`\n---\n`);
  parts.push(assembleFrameRequest(frame));

  parts.push(`\n# Social Copy Generation Task`);
  parts.push(
    `Generate **${variations} caption variations** for the content described above.`
  );

  if (frame.platform) {
    const limits = PLATFORM_LIMITS[frame.platform];
    if (limits) {
      parts.push(
        `\n**Platform constraints for ${frame.platform}:**`
      );
      parts.push(`- Max caption length: ${limits.caption} characters`);
      parts.push(`- Max hashtags: ${limits.hashtags}`);
    }
  }

  parts.push(`\n# Requirements per variation:`);
  parts.push(`1. **Hook** — attention-grabbing first line`);
  parts.push(`2. **Body** — value-driven content matching the brief`);
  parts.push(`3. **CTA** — clear call-to-action`);
  parts.push(`4. **Hashtags** — relevant, tiered (branded, niche, broad)`);

  parts.push(`\n# Output Format`);
  parts.push(`For each variation, output:`);
  parts.push(`---`);
  parts.push(`### Variation [N]`);
  parts.push(`**Caption:**`);
  parts.push(`[Full caption text]`);
  parts.push(`**CTA:** [call to action]`);
  parts.push(`**Hashtags:** [space-separated hashtags]`);
  parts.push(`**Character count:** [number]`);
  parts.push(`---`);
  parts.push(`\nOutput ONLY the variations. No preamble or explanation.`);

  return parts.join("\n");
}
