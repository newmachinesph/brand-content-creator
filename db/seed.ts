import { createDb } from "./index";
import { brandKits } from "./schema";
import { nanoid } from "nanoid";
import type { BrandKit } from "../src/types/brand";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = createDb(DATABASE_URL);

const now = new Date().toISOString();

const brand1: BrandKit = {
  id: nanoid(),
  name: "NovaTech",
  description: "AI-powered developer tools",
  createdAt: now,
  updatedAt: now,
  sections: [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice Document",
      icon: "IconMicrophone",
      updatedAt: now,
      content: `# NovaTech Brand Voice

## Tone
- **Confident but not arrogant** — We know our stuff but stay humble
- **Technical but accessible** — Explain complex ideas simply
- **Direct and concise** — Respect the reader's time

## Personality
We sound like a senior engineer who also happens to be a great communicator. We don't hide behind jargon. We get to the point.

## Do's
- Use active voice ("NovaTech builds..." not "It is built by...")
- Lead with the benefit, then explain the how
- Use code examples when they clarify faster than words

## Don'ts
- Never say "revolutionary" or "game-changing"
- Avoid corporate buzzwords (synergy, leverage, paradigm)
- Don't talk down to the reader`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: now,
      content: `# Messaging Framework

## Value Proposition
NovaTech gives developers AI tools that understand their codebase — so they ship faster without sacrificing quality.

## Elevator Pitch
NovaTech builds AI developer tools that integrate directly into your workflow. Instead of context-switching to a chatbot, our tools understand your codebase, your patterns, and your team's conventions to deliver suggestions that actually make sense.

## Key Messages
1. **Speed without shortcuts** — Ship 3x faster with AI that knows your code
2. **Your patterns, amplified** — AI that learns your team's conventions
3. **Privacy-first** — Your code never leaves your infrastructure

## Tagline
"Code smarter. Ship faster."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide / Copy Rules",
      icon: "IconPencil",
      updatedAt: now,
      content: `# Style Guide

## Writing Rules
- Sentence case for all headings
- Oxford comma always
- Numbers: spell out one through nine, use numerals for 10+
- Em dash with no spaces — like this
- Use "developer" not "dev" in formal copy
- "AI" not "A.I." or "ai"

## Formatting
- Headlines: 6-10 words max
- Body copy: 15-20 words per sentence average
- Paragraphs: 3-4 sentences max
- CTAs: Start with a verb ("Start building", "Try it free")

## Capitalization
- Product names: Always capitalize (NovaTech, CodeLens, FlowCI)
- Features: Lowercase unless proper noun
- AI terms: "large language model" (lowercase), "LLM" (abbreviation OK)`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity Specs",
      icon: "IconPalette",
      updatedAt: now,
      content: `# Visual Identity

## Colors
- Primary: #6366F1 (Indigo 500)
- Secondary: #0F172A (Slate 900)
- Accent: #22D3EE (Cyan 400)
- Background: #020617 (Slate 950)
- Text: #E2E8F0 (Slate 200)

## Typography
- Headings: Inter, semibold
- Body: Inter, regular
- Code: JetBrains Mono

## Logo Usage
- Minimum clear space: 1x the height of the "N" mark
- Never stretch, rotate, or recolor the logo
- Dark backgrounds: use white logotype
- Light backgrounds: use slate-900 logotype

## Photography
- Style: Abstract gradients, code on dark screens
- Never: stock photos of people pointing at screens`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audience Profiles",
      icon: "IconUsers",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Senior Full-Stack Developer",
          content:
            "10+ years experience. Works at a Series B-D startup (50-500 employees). Uses VS Code, TypeScript, React. Cares deeply about code quality but frustrated by slow review cycles. Evaluates tools based on real-world utility, not hype.",
          metadata: { role: "IC Engineer", company_size: "50-500" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Engineering Manager",
          content:
            "Manages a team of 5-15 engineers. Focused on velocity and quality metrics. Needs to justify tool purchases to VP of Engineering. Cares about team adoption rates and measurable productivity gains.",
          metadata: { role: "Manager", company_size: "100-1000" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "content-examples",
      label: "Content Examples",
      icon: "IconStar",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Launch tweet — CodeLens v2",
          content:
            "CodeLens v2 is here. AI code review that actually understands your codebase.\n\n→ Catches bugs your linter misses\n→ Suggests fixes in your team's style\n→ Runs in 30 seconds, not 30 minutes\n\nTry it free: novatech.dev/codelens",
          metadata: { platform: "X", engagement: "2.4K likes" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Blog intro — Why AI code review matters",
          content:
            "Your team reviews 20+ PRs a week. Each one takes 30 minutes of a senior engineer's time. That's 40+ hours a month spent reading diffs instead of shipping features.\n\nWhat if you could get the first pass done in seconds?",
          metadata: { platform: "Blog", type: "Long-form" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Email subject line — Onboarding drip",
          content:
            'Subject: "Your first AI code review in 2 minutes"\n\nBody: Hey {first_name}, you signed up for CodeLens yesterday. Here\'s the fastest way to see it in action...',
          metadata: { platform: "Email", type: "Drip sequence" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "anti-examples",
      label: "Anti-Examples",
      icon: "IconAlertTriangle",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Hype-driven copy",
          content:
            '"NovaTech is a REVOLUTIONARY AI platform that will TRANSFORM how you code FOREVER!" — Too hyperbolic, sounds like a scam.',
          metadata: { issue: "Tone" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Vague enterprise speak",
          content:
            '"Leverage our synergistic AI-driven solutions to optimize your software development lifecycle." — Says nothing concrete.',
          metadata: { issue: "Clarity" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Product/Service Descriptions",
      icon: "IconPackage",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "CodeLens",
          content:
            "AI-powered code review that understands your codebase. Catches bugs, suggests improvements, and enforces your team's coding standards — all in under 60 seconds per PR.",
          metadata: { pricing: "$29/seat/mo", status: "GA" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "FlowCI",
          content:
            "Intelligent CI/CD pipeline optimization. Automatically detects flaky tests, parallelizes builds, and cuts your pipeline time by 60%. Integrates with GitHub Actions, GitLab CI, and CircleCI.",
          metadata: { pricing: "$49/seat/mo", status: "Beta" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ],
};

const brand2: BrandKit = {
  id: nanoid(),
  name: "Bloom & Root",
  description: "Sustainable home and garden essentials",
  createdAt: now,
  updatedAt: now,
  sections: [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice Document",
      icon: "IconMicrophone",
      updatedAt: now,
      content: `# Bloom & Root Brand Voice

## Tone
- **Warm and inviting** — Like a knowledgeable friend at the farmers market
- **Grounded and honest** — We don't greenwash or over-promise
- **Gently educational** — Teach without lecturing

## Personality
We sound like someone who genuinely loves what they do and wants to share it. We're the neighbor who brings you tomatoes from their garden and tells you how to grow your own.

## Language
- Use "we" and "you" — it's a conversation
- Sensory language: textures, scents, colors
- Seasonal references to connect with nature's rhythm
- Simple, warm words over formal ones ("home" not "residence")`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: now,
      content: `# Messaging Framework

## Value Proposition
Bloom & Root makes sustainable living feel effortless — beautiful, toxin-free home and garden products that you'll actually want to use every day.

## Elevator Pitch
We create thoughtfully designed home and garden essentials from sustainable materials. Every product is toxin-free, plastic-free, and made to last — because living gently shouldn't feel like a sacrifice.

## Key Messages
1. **Beauty meets intention** — Products designed to be loved, not just used
2. **Gentle on everything** — Safe for your family, your home, and the planet
3. **Built to last** — Quality materials that age gracefully

## Tagline
"Rooted in care."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide / Copy Rules",
      icon: "IconPencil",
      updatedAt: now,
      content: `# Copy Rules

- Never say "eco-friendly" — too vague. Say specifically what makes it sustainable.
- Avoid guilt-based messaging ("You SHOULD be doing this")
- Use lowercase for a softer feel in social captions
- Product descriptions: Lead with how it feels to use, then materials, then sustainability
- Seasonal collections use nature metaphors (not clichés)
- Numbers: spell out in headlines, numerals in specs`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity Specs",
      icon: "IconPalette",
      updatedAt: now,
      content: `# Visual Identity

## Colors
- Primary: #5B7553 (Sage green)
- Secondary: #F5F0EB (Warm cream)
- Accent: #C8A87C (Warm gold)
- Text: #2D2A26 (Warm charcoal)

## Typography
- Headings: Playfair Display, regular
- Body: Lato, light/regular
- Accents: Lato italic for callouts

## Photography
- Natural light only, golden hour preferred
- Show products in real home settings (not studio white)
- Hands in frame — show the product being used and loved
- Earth tones, linen textures, wood surfaces

## Logo
- Primary: Sage green on cream
- Secondary: Warm charcoal on white
- Never place on busy backgrounds`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audience Profiles",
      icon: "IconUsers",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "The Intentional Homemaker",
          content:
            "30-45, homeowner, 1-2 kids. Shops at farmers markets on weekends. Follows home design accounts on Instagram. Willing to pay more for quality and sustainability but doesn't want to sacrifice aesthetics. Researches before buying.",
          metadata: { age: "30-45", income: "$80-150K" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "The New Gardener",
          content:
            "25-35, apartment or first home with a small yard/balcony. Excited about growing food but intimidated by where to start. Follows plant TikTok. Wants products that look good in a small space and come with guidance.",
          metadata: { age: "25-35", experience: "Beginner" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "content-examples",
      label: "Content Examples",
      icon: "IconStar",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Instagram caption — Linen apron launch",
          content:
            "this apron has been two years in the making.\n\nwe tested 14 linen weights before landing on this one — heavy enough to protect, soft enough to forget you're wearing it.\n\ndyed with plant-based pigments in small batches. gets softer with every wash.\n\nlink in bio.",
          metadata: { platform: "Instagram", engagement: "890 likes" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Email — Spring collection announcement",
          content:
            "Subject: spring is almost here (and so is something new)\n\nThe days are getting longer. The soil is warming up. And we've been busy.\n\nOur Spring collection drops March 15 — ceramic planters, herb garden kits, and our best-selling linen towels in three new colors inspired by early spring blooms.",
          metadata: { platform: "Email", type: "Launch" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "anti-examples",
      label: "Anti-Examples",
      icon: "IconAlertTriangle",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Guilt-based messaging",
          content:
            '"Stop poisoning your family with toxic cleaning products!" — We never use fear or shame to sell.',
          metadata: { issue: "Tone" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Greenwashing vagueness",
          content:
            '"Our eco-friendly products are good for the planet!" — Too vague. What materials? What certifications? Be specific.',
          metadata: { issue: "Specificity" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Product/Service Descriptions",
      icon: "IconPackage",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Heritage Linen Apron",
          content:
            "Made from 100% European flax linen, plant-dyed in small batches. Features an adjustable crossback strap (no neck strain), two deep pockets, and a reinforced loop for your kitchen towel. Gets softer with every wash.",
          metadata: { price: "$68", category: "Kitchen" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Windowsill Herb Kit",
          content:
            "Everything you need to grow basil, thyme, and cilantro on your windowsill. Includes three handmade ceramic pots, organic seed packets, coconut coir soil, and a 12-page growing guide written for beginners.",
          metadata: { price: "$45", category: "Garden" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ],
};

async function seed() {
  console.log("Seeding 2 brands...");

  // Clear existing data
  await db.delete(brandKits);

  // Insert brand 1
  await db.insert(brandKits).values({
    id: brand1.id,
    name: brand1.name,
    description: brand1.description,
    data: brand1,
    createdAt: new Date(brand1.createdAt),
    updatedAt: new Date(brand1.updatedAt),
  });
  console.log(`  ✓ ${brand1.name}`);

  // Insert brand 2
  await db.insert(brandKits).values({
    id: brand2.id,
    name: brand2.name,
    description: brand2.description,
    data: brand2,
    createdAt: new Date(brand2.createdAt),
    updatedAt: new Date(brand2.updatedAt),
  });
  console.log(`  ✓ ${brand2.name}`);

  console.log("Done!");
}

seed().catch(console.error);
