import type { Frame } from "@/types/storyboard";
import {
  assembleBrandContext,
  assembleFrameRequest,
  type PromptContext,
} from "./context-assembler";

export function buildDesignSpecPrompt(
  ctx: PromptContext,
  frame: Frame | undefined,
  canvasDimensions: { width: number; height: number },
  userContent: string,
): string {
  const parts: string[] = [];

  parts.push(assembleBrandContext(ctx));

  if (frame) {
    parts.push(`\n---\n`);
    parts.push(assembleFrameRequest(frame));
  }

  // ── Role & Task ──────────────────────────────────────────────────

  parts.push(`\n# Auto-Design Task`);
  parts.push(
    `You are an elite graphic designer creating a premium social media graphic as a Fabric.js JSON specification. ` +
    `Your output must look like it came from a professional design studio — atmospheric, layered, and typographically sophisticated.`,
  );
  parts.push(
    `\nDesign a graphic for the content below. Decide the best layout, typography hierarchy, and visual treatment ` +
    `based on the brand's design system. Do NOT invent new copy — use exactly the content provided, selecting which ` +
    `parts work best as headline, subheading, body, data points, and hashtag row.`,
  );

  parts.push(
    `\n**Canvas dimensions:** ${canvasDimensions.width}×${canvasDimensions.height}px`,
  );

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(canvasDimensions.width, canvasDimensions.height);
  parts.push(
    `**Aspect ratio:** ${canvasDimensions.width / d}:${canvasDimensions.height / d}`,
  );

  // ── Content to Design ────────────────────────────────────────────

  parts.push(`\n# Content to Design`);
  parts.push(
    `Below is the actual content to place on the graphic. Parse it intelligently:`,
  );
  parts.push(
    `- Extract the strongest phrase for the hero headline (keep it short — 2-5 words)`,
  );
  parts.push(
    `- Use supporting text as subheading or body (use maxWidth for wrapping)`,
  );
  parts.push(
    `- Any numbers/metrics become stat strip items`,
  );
  parts.push(
    `- Hashtags go in a subtle row at the bottom in mono font`,
  );
  parts.push(
    `- Brand name goes in the brand lockup area`,
  );
  parts.push(`\n\`\`\`\n${userContent.trim()}\n\`\`\``);

  // Additional context from frame/campaign
  if (frame || ctx.campaign) {
    parts.push(`\n## Additional Context`);
    if (frame?.data.brief) {
      parts.push(`- **Brief:** ${frame.data.brief}`);
    }
    if (ctx.campaign) {
      parts.push(`- **Campaign:** ${ctx.campaign.name}`);
      if (ctx.campaign.objective) {
        parts.push(`- **Goal:** ${ctx.campaign.objective}`);
      }
      if (ctx.campaign.contentPillars.length > 0) {
        parts.push(
          `- **Pillars:** ${ctx.campaign.contentPillars.join(", ")}`,
        );
      }
    }
  }

  // ── Font System ──────────────────────────────────────────────────

  parts.push(`\n# Typography System (Google Fonts)`);
  parts.push(
    `Pick 2-3 fonts from this curated set. Every textBlock MUST specify a fontFamily.`,
  );
  parts.push(`
**Display (headlines, hero text):** Anton, Bebas Neue, Oswald, Playfair Display, Abril Fatface
**Sans-serif (subheadings, body):** DM Sans, Inter, Poppins, Montserrat, Raleway, Work Sans, Outfit
**Serif (editorial, elegant):** Merriweather, Lora, Crimson Text, Source Serif 4
**Monospace (data, stats, codes):** IBM Plex Mono, JetBrains Mono, Fira Code, Space Mono`);

  parts.push(`
**Font pairing rules:**
- Pair one display font (bold/uppercase headlines) with one sans (body text)
- Optionally add a mono font for data points, stats, or hashtags
- Example pairing: Anton + DM Sans + IBM Plex Mono
- Example pairing: Playfair Display + Inter + Space Mono
- Example pairing: Bebas Neue + Outfit + Fira Code`);

  parts.push(`
**Typography hierarchy (MANDATORY — use all relevant tiers):**
- Hero/headline: 48-72px, display font, bold, uppercase, charSpacing 50-150
- Subheading: 20-28px, sans font, weight 500-600
- Body text: 14-18px, sans font, weight 400, lineHeight 1.4-1.6
- Data/stats: 28-40px, mono font, bold — with small 10-12px labels above or below
- Micro-labels: 9-12px, sans or mono, uppercase, charSpacing 100-200, opacity 0.6-0.8
- Hashtags: 11-13px, mono, opacity 0.5-0.7`);

  // ── Color Strategy ───────────────────────────────────────────────

  parts.push(`\n# Color Strategy`);
  parts.push(
    `- Use brand colors from the Brand Vault above (extract hex codes from Visual Identity section)`,
  );
  parts.push(
    `- Brand primary/accent color should be ≤15% of surface area — use it for accent bars, dots, highlights, pill backgrounds`,
  );
  parts.push(`- **Dark atmospheric base**: background should be dark (#0a0a0a to #1a1a1a)`);
  parts.push(`- **Text colors**: pure white (#ffffff) for headlines, slightly muted (#e0e0e0, #a0a0a0) for secondary text`);
  parts.push(`- **Depth via opacity**: use shapes at 0.05-0.3 opacity for layering, never more than 0.4 for background elements`);
  parts.push(`- Create contrast: dark base → mid-opacity shapes → bright text on top`);

  // ── Atmospheric Design Rules ─────────────────────────────────────

  parts.push(`\n# Atmospheric Design Rules`);
  parts.push(
    `Build premium depth with layered background elements. Use 4-8 shapes BEFORE any text:`,
  );
  parts.push(`
1. **Base**: Dark solid backgroundColor (#0a0a0a or similar)
2. **Gradient orb(s)**: 1-2 large circles with radial gradients (brand accent → transparent), opacity 0.15-0.3, positioned off-center
3. **Accent bars/strips**: Thin horizontal or vertical rects in brand accent, opacity 0.6-1.0, used as dividers or decoration
4. **Overlay panels**: Semi-transparent rects (#ffffff or brand color at 0.03-0.08 opacity) as content containers
5. **Dot grid / grid lines**: Series of small circles (r=1-2, opacity 0.1) or thin lines creating a subtle grid pattern — OPTIONAL
6. **Vignette**: Large circle with radial gradient from transparent to dark, covering edges — OPTIONAL`);

  parts.push(`
**DO NOT:**
- Place text directly on raw background without a shape or overlay beneath it
- Use bright/saturated backgrounds — always dark and moody
- Make all shapes the same opacity — vary between 0.05 and 1.0 for depth
- Forget shadows on key text elements`);

  // ── Professional Layout Patterns ─────────────────────────────────

  parts.push(`\n# Professional Layout Patterns`);
  parts.push(`Choose and adapt one of these patterns based on the design request:`);
  parts.push(`
**Brand Lockup** (top area):
- Brand name in display font, small (14-18px), uppercase, high charSpacing (150-200)
- Thin horizontal line (1-2px) below as separator
- Tagline or category in micro-label style below the line

**Stat Strip** (data showcase):
- Row of 3-4 metric blocks: large number (mono, 28-36px, bold) with small label below (10-12px, uppercase, muted)
- Separated by thin vertical lines or spacing
- Great for showcasing numbers, dates, metrics

**Status Pill**:
- Small rounded rect (rx: 12-16, height: 24-28) with uppercase text inside
- Brand accent fill at 0.15 opacity, text in brand accent color
- Used for categories, statuses, tags

**Content Card**:
- Semi-transparent rect as container (0.03-0.08 opacity, rx: 8-12)
- Content inside with consistent padding (24-40px from edges)
- Clear visual hierarchy: heading → body → data/CTA

**CTA Block**:
- Rounded rect filled with brand accent color (full opacity)
- Bold white text centered inside
- Subtle shadow for elevation`);

  // ── Layout Positioning Rules ─────────────────────────────────────

  parts.push(`\n# Layout Positioning Rules`);
  parts.push(
    `- x=0, y=0 is the top-left corner of the ${canvasDimensions.width}×${canvasDimensions.height} canvas`,
  );
  parts.push(`- Leave 32-48px padding from all canvas edges`);
  parts.push(
    `- Align text blocks to a consistent left margin (e.g. x=48 for all left-aligned text)`,
  );
  parts.push(`- Stack elements vertically with 12-24px gaps between text blocks`);
  parts.push(
    `- For centered layouts, use originX: "center" and x at canvas width/2`,
  );
  parts.push(
    `- Place brand lockup at top (y: 40-60), main content in middle third, hashtags/footer at bottom`,
  );

  // ── Image Handling ───────────────────────────────────────────────

  parts.push(`\n# Image Handling`);
  parts.push(
    `- If the design needs a photo/image, set needsImage to true and provide a detailed imagePrompt`,
  );
  parts.push(
    `- If the design is text-only (quote, announcement, promo, data showcase), set needsImage to false — these often look MORE premium without images`,
  );
  parts.push(
    `- When an image is needed, create an imagePlaceholder defining where it should go`,
  );
  parts.push(
    `- Add a semi-transparent dark overlay shape (opacity 0.4-0.7) between the image area and text`,
  );

  // ── Output Schema ────────────────────────────────────────────────

  parts.push(`\n# Output Format`);
  parts.push(
    `Respond with ONLY a valid JSON object (no markdown fences, no explanation). Schema:`,
  );
  parts.push(`
{
  "backgroundColor": "#hex — dark color like #0a0a0a",
  "backgroundGradient": {
    "type": "linear" | "radial",
    "coords": { "x1": 0-1, "y1": 0-1, "x2": 0-1, "y2": 0-1, "r1": number, "r2": number },
    "colorStops": [{ "offset": 0-1, "color": "#hex or rgba()" }]
  },
  "fonts": ["FontFamily1", "FontFamily2", "FontFamily3"],
  "needsImage": true | false,
  "imagePrompt": "detailed AI image generation prompt (only if needsImage)",
  "imagePlaceholder": { "x": num, "y": num, "width": num, "height": num, "label": "description" },
  "shapes": [
    {
      "type": "rect" | "circle" | "line",
      "x": num, "y": num,
      "fill": "#hex",
      "stroke": "#hex (optional)",
      "strokeWidth": num (optional),
      "opacity": 0-1,
      "width": num (rect), "height": num (rect), "rx": num (rect corner radius),
      "radius": num (circle),
      "x2": num (line end x), "y2": num (line end y),
      "gradient": {
        "type": "linear" | "radial",
        "coords": { "x1": 0-1, "y1": 0-1, "x2": 0-1, "y2": 0-1, "r1": num, "r2": num },
        "colorStops": [{ "offset": 0-1, "color": "#hex or rgba()" }]
      },
      "shadow": { "color": "rgba()", "blur": num, "offsetX": num, "offsetY": num }
    }
  ],
  "textBlocks": [
    {
      "text": "the text content",
      "fontFamily": "Google Font name — REQUIRED",
      "fontSize": num (px),
      "fontWeight": "normal" | "bold" | "100"-"900",
      "fontStyle": "normal" | "italic",
      "fill": "#hex",
      "x": num (px from left), "y": num (px from top),
      "textAlign": "left" | "center" | "right",
      "originX": "left" | "center" | "right",
      "originY": "top" | "center" | "bottom",
      "charSpacing": num (0-300, letter spacing in fabric units),
      "lineHeight": num (1.0-2.0 multiplier),
      "textTransform": "none" | "uppercase" | "lowercase",
      "maxWidth": num (enables word wrapping — use for body text and long strings),
      "opacity": 0-1,
      "shadow": { "color": "rgba()", "blur": num, "offsetX": num, "offsetY": num }
    }
  ]
}`);

  // ── Quality Checklist ────────────────────────────────────────────

  parts.push(`\n# Quality Checklist (MUST satisfy ALL)`);
  parts.push(`1. Every textBlock has a fontFamily from the Google Fonts list above`);
  parts.push(`2. At least 4 shapes for depth (gradient orbs, accent bars, overlays, containers)`);
  parts.push(`3. At least one gradient (on backgroundGradient or a shape)`);
  parts.push(`4. Dark atmospheric background (#0a0a0a to #1a1a1a)`);
  parts.push(`5. No text directly on raw background — always on a shape layer or overlay`);
  parts.push(`6. charSpacing > 0 for all uppercase text`);
  parts.push(`7. Use textTransform "uppercase" for headlines and labels`);
  parts.push(`8. Use maxWidth for body text and any string that could wrap`);
  parts.push(`9. Use shadows sparingly — max 2-3 elements, subtle (blur 4-12, rgba black 0.2-0.4)`);
  parts.push(`10. Font list in "fonts" array matches all fontFamily values used in textBlocks`);
  parts.push(`11. All coordinates are within the ${canvasDimensions.width}×${canvasDimensions.height} canvas bounds`);
  parts.push(`12. Consistent left margin for aligned text (pick one x value and reuse it)`);

  parts.push(
    `\nOutput ONLY the JSON object. No preamble, no markdown fences, no explanation.`,
  );

  return parts.join("\n");
}
