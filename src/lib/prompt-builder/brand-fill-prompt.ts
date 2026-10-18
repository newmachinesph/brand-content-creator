interface WebsiteContent {
  url: string;
  content: string;
}

const MAX_CHARS_PER_URL = 20_000;

export function buildBrandFillPrompt(
  brandName: string,
  brandDescription: string,
  websites: WebsiteContent[]
): string {
  const parts: string[] = [];

  parts.push(`You are a brand strategist. Your ONLY job is to output a JSON object. Do NOT output any explanations, markdown, or text outside the JSON.`);
  parts.push(``);
  parts.push(`# Task: Generate Brand Vault content for "${brandName}"`);
  if (brandDescription) {
    parts.push(`Brand description: ${brandDescription}`);
  }

  parts.push(``);
  parts.push(`## Reference Website Content`);
  parts.push(``);

  for (const site of websites) {
    const truncated =
      site.content.length > MAX_CHARS_PER_URL
        ? site.content.slice(0, MAX_CHARS_PER_URL) + "\n...[truncated]"
        : site.content;
    parts.push(`### Source: ${site.url}`);
    parts.push(truncated);
    parts.push(``);
  }

  parts.push(`## Output Requirements`);
  parts.push(``);
  parts.push(`CRITICAL: Your entire response must be a single valid JSON object. No text before it. No text after it. No markdown code fences. Just raw JSON.`);
  parts.push(``);
  parts.push(`The JSON has 2 top-level keys: "documents" (4 keys, each a unique markdown string) and "lists" (4 keys, each an array of items).`);
  parts.push(``);
  parts.push(`IMPORTANT: Each document section must contain COMPLETELY DIFFERENT content. They cover different topics:`);
  parts.push(``);
  parts.push(`{`);
  parts.push(`  "documents": {`);
  parts.push(`    "brand-voice": "TOPIC: How the brand SPEAKS. Include: personality traits (e.g. friendly, authoritative), tone spectrum (formal to casual), vocabulary preferences, emotional register, communication do's and don'ts. Use ## headings.",`);
  parts.push(`    "messaging-framework": "TOPIC: What the brand SAYS. Include: mission statement, vision statement, value proposition, elevator pitch, tagline options, positioning statement, key messages for different audiences. This is DIFFERENT from brand voice — voice is HOW you say it, messaging is WHAT you say.",`);
  parts.push(`    "style-guide": "TOPIC: Writing RULES. Include: grammar preferences (Oxford comma yes/no), capitalization rules (title case vs sentence case), punctuation style, formatting conventions, headline structure, CTA patterns, content length guidelines. This is technical writing rules, NOT the voice or messaging.",`);
  parts.push(`    "visual-identity": "TOPIC: How the brand LOOKS. Include: primary/secondary/accent colors with hex codes, typography (font families, sizes, weights), logo usage guidelines, imagery style (photography vs illustration), spacing principles, visual hierarchy rules."`);
  parts.push(`  },`);
  parts.push(`  "lists": {`);
  parts.push(`    "target-audiences": [{"title": "Segment Name", "content": "Demographics, psychographics, pain points, goals, how the brand serves them.", "metadata": {"segment": "primary or secondary"}}],`);
  parts.push(`    "content-examples": [{"title": "Example Name", "content": "A FULL sample piece of content written in the brand's voice — e.g. a social post, email intro, or blog paragraph."}],`);
  parts.push(`    "anti-examples": [{"title": "What to Avoid", "content": "A sample of BAD content that violates the brand voice, with explanation of what's wrong."}],`);
  parts.push(`    "products": [{"title": "Product/Service Name", "content": "What it is, key features, benefits, who it's for.", "metadata": {"category": "product category"}}]`);
  parts.push(`  }`);
  parts.push(`}`);
  parts.push(``);
  parts.push(`Rules:`);
  parts.push(`- Each of the 4 document values MUST be unique and cover its specific topic — do NOT repeat content across sections.`);
  parts.push(`- Use rich markdown with ## headings, **bold**, bullet lists, and tables inside document values.`);
  parts.push(`- Each document: at least 200 words.`);
  parts.push(`- Each list: 3-5 items with brand-specific content.`);
  parts.push(`- Extract real info from the website. Infer where needed based on the brand's industry and positioning.`);
  parts.push(`- Use \\n for newlines inside JSON string values.`);
  parts.push(`- Ensure valid JSON — escape quotes and special characters.`);
  parts.push(`- Output ONLY the JSON object. Nothing else.`);

  return parts.join("\n");
}
