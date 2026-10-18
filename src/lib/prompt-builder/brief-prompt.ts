import type { BriefType } from "@/types/common";
import type { Frame } from "@/types/storyboard";
import {
  assembleBrandContext,
  assembleFrameRequest,
  type PromptContext,
} from "./context-assembler";

const BRIEF_TYPE_INSTRUCTIONS: Record<BriefType, string> = {
  photo: `Generate a detailed photo brief including:
- Shot description (framing, angle, composition)
- Subject/props needed
- Lighting direction (natural, studio, golden hour, etc.)
- Color palette/mood
- Background/location details
- Styling/wardrobe notes if applicable
- Text overlay or graphic elements if needed`,

  video: `Generate a detailed video brief including:
- Concept/storyline outline
- Shot list (scene by scene)
- Duration recommendation
- Audio direction (music style, voiceover notes)
- On-screen text/captions plan
- Transitions and pacing notes
- Platform-specific requirements (aspect ratio, safe zones)`,

  copy: `Generate a detailed copy brief including:
- Key message hierarchy (primary, secondary, supporting)
- Tone and voice direction
- Target audience specifics
- Call-to-action recommendations
- Hook/opening line suggestions
- Hashtag themes
- Character count targets per section`,

  graphic: `Generate a detailed graphic design brief including:
- Layout direction and composition
- Text hierarchy and content
- Color scheme with specific hex codes from brand palette
- Typography direction
- Image/illustration style
- Dimensions and format
- File deliverable requirements`,
};

export function buildBriefPrompt(
  ctx: PromptContext,
  frame: Frame,
  briefType: BriefType
): string {
  const parts: string[] = [];

  parts.push(assembleBrandContext(ctx));
  parts.push(`\n---\n`);
  parts.push(assembleFrameRequest(frame));

  parts.push(`\n# Brief Generation Task`);
  parts.push(
    `Generate a **${briefType} production brief** for the content described above.`
  );
  parts.push(BRIEF_TYPE_INSTRUCTIONS[briefType]);

  parts.push(`\n# Output Format`);
  parts.push(
    `Output a structured, actionable brief that a creative team member can immediately use to produce the content.`
  );
  parts.push(`Use clear headings and bullet points. Be specific — avoid vague instructions.`);
  parts.push(`Output ONLY the brief, no preamble or explanation.`);

  return parts.join("\n");
}
