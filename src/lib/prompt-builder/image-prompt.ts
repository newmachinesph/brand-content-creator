import type { Frame } from "@/types/storyboard";
import {
  assembleBrandContext,
  assembleFrameRequest,
  type PromptContext,
} from "./context-assembler";

export function buildImagePrompt(
  ctx: PromptContext,
  frame: Frame | undefined,
  canvasDimensions: { width: number; height: number },
  additionalContext?: string
): string {
  const parts: string[] = [];

  parts.push(assembleBrandContext(ctx));

  if (frame) {
    parts.push(`\n---\n`);
    parts.push(assembleFrameRequest(frame));
  }

  parts.push(`\n# Image Generation Task`);
  parts.push(
    `Generate a detailed image prompt suitable for Nano Banana Pro (the VA's AI image generator).`
  );
  parts.push(
    `\n**Canvas dimensions:** ${canvasDimensions.width}x${canvasDimensions.height}px`
  );

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(canvasDimensions.width, canvasDimensions.height);
  parts.push(
    `**Aspect ratio:** ${canvasDimensions.width / d}:${canvasDimensions.height / d}`
  );

  if (additionalContext?.trim()) {
    parts.push(`\n**Additional direction:** ${additionalContext.trim()}`);
  }

  parts.push(`\n# Output Requirements`);
  parts.push(
    `Provide the following sections, clearly labeled with headings:\n`
  );
  parts.push(
    `## Nano Banana Pro Prompt\nA detailed, specific prompt (150-300 words) describing the exact image to generate. Include:\n- Subject matter and composition\n- Color palette (aligned with brand colors above)\n- Style/aesthetic (photographic, illustrated, 3D, etc.)\n- Mood and lighting\n- Any text-free zones needed for overlay text`
  );
  parts.push(
    `\n## Short Version\nA condensed version of the prompt (50-80 words) — the essential visual description without extra detail.`
  );
  parts.push(
    `\n## Negative Prompt\nWhat to explicitly avoid in the generation (5-10 items).`
  );
  parts.push(
    `\n## Direction Notes\n2-3 sentences guiding the VA on how to evaluate and select the best result.`
  );

  parts.push(`\nOutput ONLY the prompt sections. No preamble or explanation.`);

  return parts.join("\n");
}
