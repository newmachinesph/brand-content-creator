/**
 * Unified seed: brands + campaigns + storyboards + frames + calendar + memories
 * All modules cross-referenced with dynamic IDs.
 *
 * Usage: bun run db/seed-all.ts
 */

import { createDb } from "./index";
import {
  brandKits,
  campaigns,
  storyboards,
  frames,
  calendarEvents,
  brandMemories,
} from "./schema";
import { nanoid } from "nanoid";
import type { BrandKit } from "../src/types/brand";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;

const db = createDb(DATABASE_URL);
const now = new Date();
const iso = now.toISOString();

// ─── Helpers ────────────────────────────────────────────────────

function id() {
  return nanoid();
}

function date(offset: string): Date {
  return new Date(offset + "T09:00:00Z");
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    console.warn("  No OPENAI_API_KEY — skipping embeddings");
    return texts.map(() => []);
  }
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "text-embedding-3-small",
      dimensions: 512,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

// ═══════════════════════════════════════════════════════════════
// BRAND 1: NovaTech
// ═══════════════════════════════════════════════════════════════

const ntBrandId = id();

const novatechBrand: BrandKit = {
  id: ntBrandId,
  name: "NovaTech",
  description: "AI-powered developer tools",
  createdAt: iso,
  updatedAt: iso,
  sections: [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice Document",
      icon: "IconMicrophone",
      updatedAt: iso,
      content: `# NovaTech Brand Voice\n\n## Tone\n- **Confident but not arrogant** — We know our stuff but stay humble\n- **Technical but accessible** — Explain complex ideas simply\n- **Direct and concise** — Respect the reader's time\n\n## Personality\nWe sound like a senior engineer who also happens to be a great communicator. We don't hide behind jargon. We get to the point.\n\n## Do's\n- Use active voice ("NovaTech builds..." not "It is built by...")\n- Lead with the benefit, then explain the how\n- Use code examples when they clarify faster than words\n\n## Don'ts\n- Never say "revolutionary" or "game-changing"\n- Avoid corporate buzzwords (synergy, leverage, paradigm)\n- Don't talk down to the reader`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: iso,
      content: `# Messaging Framework\n\n## Value Proposition\nNovaTech gives developers AI tools that understand their codebase — so they ship faster without sacrificing quality.\n\n## Elevator Pitch\nNovaTech builds AI developer tools that integrate directly into your workflow. Instead of context-switching to a chatbot, our tools understand your codebase, your patterns, and your team's conventions to deliver suggestions that actually make sense.\n\n## Key Messages\n1. **Speed without shortcuts** — Ship 3x faster with AI that knows your code\n2. **Your patterns, amplified** — AI that learns your team's conventions\n3. **Privacy-first** — Your code never leaves your infrastructure\n\n## Tagline\n"Code smarter. Ship faster."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide / Copy Rules",
      icon: "IconPencil",
      updatedAt: iso,
      content: `# Style Guide\n\n## Writing Rules\n- Sentence case for all headings\n- Oxford comma always\n- Numbers: spell out one through nine, use numerals for 10+\n- Em dash with no spaces — like this\n- Use "developer" not "dev" in formal copy\n- "AI" not "A.I." or "ai"\n\n## Formatting\n- Headlines: 6-10 words max\n- Body copy: 15-20 words per sentence average\n- Paragraphs: 3-4 sentences max\n- CTAs: Start with a verb ("Start building", "Try it free")\n\n## Capitalization\n- Product names: Always capitalize (NovaTech, CodeLens, FlowCI)\n- Features: Lowercase unless proper noun\n- AI terms: "large language model" (lowercase), "LLM" (abbreviation OK)`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity Specs",
      icon: "IconPalette",
      updatedAt: iso,
      content: `# Visual Identity\n\n## Colors\n- Primary: #6366F1 (Indigo 500)\n- Secondary: #0F172A (Slate 900)\n- Accent: #22D3EE (Cyan 400)\n- Background: #020617 (Slate 950)\n- Text: #E2E8F0 (Slate 200)\n\n## Typography\n- Headings: Inter, semibold\n- Body: Inter, regular\n- Code: JetBrains Mono\n\n## Logo Usage\n- Minimum clear space: 1x the height of the "N" mark\n- Never stretch, rotate, or recolor the logo\n- Dark backgrounds: use white logotype\n- Light backgrounds: use slate-900 logotype\n\n## Photography\n- Style: Abstract gradients, code on dark screens\n- Never: stock photos of people pointing at screens`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audience Profiles",
      icon: "IconUsers",
      updatedAt: iso,
      items: [
        { id: id(), title: "Senior Full-Stack Developer", content: "10+ years experience. Works at a Series B-D startup (50-500 employees). Uses VS Code, TypeScript, React. Cares deeply about code quality but frustrated by slow review cycles. Evaluates tools based on real-world utility, not hype.", metadata: { role: "IC Engineer", company_size: "50-500" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Engineering Manager", content: "Manages a team of 5-15 engineers. Focused on velocity and quality metrics. Needs to justify tool purchases to VP of Engineering. Cares about team adoption rates and measurable productivity gains.", metadata: { role: "Manager", company_size: "100-1000" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "content-examples",
      label: "Content Examples",
      icon: "IconStar",
      updatedAt: iso,
      items: [
        { id: id(), title: "Launch tweet — CodeLens v2", content: "CodeLens v2 is here. AI code review that actually understands your codebase.\n\n→ Catches bugs your linter misses\n→ Suggests fixes in your team's style\n→ Runs in 30 seconds, not 30 minutes\n\nTry it free: novatech.dev/codelens", metadata: { platform: "X", engagement: "2.4K likes" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Blog intro — Why AI code review matters", content: "Your team reviews 20+ PRs a week. Each one takes 30 minutes of a senior engineer's time. That's 40+ hours a month spent reading diffs instead of shipping features.\n\nWhat if you could get the first pass done in seconds?", metadata: { platform: "Blog", type: "Long-form" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "anti-examples",
      label: "Anti-Examples",
      icon: "IconAlertTriangle",
      updatedAt: iso,
      items: [
        { id: id(), title: "Hype-driven copy", content: '"NovaTech is a REVOLUTIONARY AI platform that will TRANSFORM how you code FOREVER!" — Too hyperbolic, sounds like a scam.', metadata: { issue: "Tone" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Vague enterprise speak", content: '"Leverage our synergistic AI-driven solutions to optimize your software development lifecycle." — Says nothing concrete.', metadata: { issue: "Clarity" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Product/Service Descriptions",
      icon: "IconPackage",
      updatedAt: iso,
      items: [
        { id: id(), title: "CodeLens", content: "AI-powered code review that understands your codebase. Catches bugs, suggests improvements, and enforces your team's coding standards — all in under 60 seconds per PR.", metadata: { pricing: "$29/seat/mo", status: "GA" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "FlowCI", content: "Intelligent CI/CD pipeline optimization. Automatically detects flaky tests, parallelizes builds, and cuts your pipeline time by 60%. Integrates with GitHub Actions, GitLab CI, and CircleCI.", metadata: { pricing: "$49/seat/mo", status: "Beta" }, createdAt: iso, updatedAt: iso },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// BRAND 2: Bloom & Root
// ═══════════════════════════════════════════════════════════════

const brBrandId = id();

const bloomBrand: BrandKit = {
  id: brBrandId,
  name: "Bloom & Root",
  description: "Sustainable home and garden essentials",
  createdAt: iso,
  updatedAt: iso,
  sections: [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice Document",
      icon: "IconMicrophone",
      updatedAt: iso,
      content: `# Bloom & Root Brand Voice\n\n## Tone\n- **Warm and inviting** — Like a knowledgeable friend at the farmers market\n- **Grounded and honest** — We don't greenwash or over-promise\n- **Gently educational** — Teach without lecturing\n\n## Personality\nWe sound like someone who genuinely loves what they do and wants to share it. We're the neighbor who brings you tomatoes from their garden and tells you how to grow your own.\n\n## Language\n- Use "we" and "you" — it's a conversation\n- Sensory language: textures, scents, colors\n- Seasonal references to connect with nature's rhythm\n- Simple, warm words over formal ones ("home" not "residence")`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: iso,
      content: `# Messaging Framework\n\n## Value Proposition\nBloom & Root makes sustainable living feel effortless — beautiful, toxin-free home and garden products that you'll actually want to use every day.\n\n## Elevator Pitch\nWe create thoughtfully designed home and garden essentials from sustainable materials. Every product is toxin-free, plastic-free, and made to last — because living gently shouldn't feel like a sacrifice.\n\n## Key Messages\n1. **Beauty meets intention** — Products designed to be loved, not just used\n2. **Gentle on everything** — Safe for your family, your home, and the planet\n3. **Built to last** — Quality materials that age gracefully\n\n## Tagline\n"Rooted in care."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide / Copy Rules",
      icon: "IconPencil",
      updatedAt: iso,
      content: `# Copy Rules\n\n- Never say "eco-friendly" — too vague. Say specifically what makes it sustainable.\n- Avoid guilt-based messaging ("You SHOULD be doing this")\n- Use lowercase for a softer feel in social captions\n- Product descriptions: Lead with how it feels to use, then materials, then sustainability\n- Seasonal collections use nature metaphors (not clichés)\n- Numbers: spell out in headlines, numerals in specs`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity Specs",
      icon: "IconPalette",
      updatedAt: iso,
      content: `# Visual Identity\n\n## Colors\n- Primary: #5B7553 (Sage green)\n- Secondary: #F5F0EB (Warm cream)\n- Accent: #C8A87C (Warm gold)\n- Text: #2D2A26 (Warm charcoal)\n\n## Typography\n- Headings: Playfair Display, regular\n- Body: Lato, light/regular\n- Accents: Lato italic for callouts\n\n## Photography\n- Natural light only, golden hour preferred\n- Show products in real home settings (not studio white)\n- Hands in frame — show the product being used and loved\n- Earth tones, linen textures, wood surfaces\n\n## Logo\n- Primary: Sage green on cream\n- Secondary: Warm charcoal on white\n- Never place on busy backgrounds`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audience Profiles",
      icon: "IconUsers",
      updatedAt: iso,
      items: [
        { id: id(), title: "The Intentional Homemaker", content: "30-45, homeowner, 1-2 kids. Shops at farmers markets on weekends. Follows home design accounts on Instagram. Willing to pay more for quality and sustainability but doesn't want to sacrifice aesthetics. Researches before buying.", metadata: { age: "30-45", income: "$80-150K" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "The New Gardener", content: "25-35, apartment or first home with a small yard/balcony. Excited about growing food but intimidated by where to start. Follows plant TikTok. Wants products that look good in a small space and come with guidance.", metadata: { age: "25-35", experience: "Beginner" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "content-examples",
      label: "Content Examples",
      icon: "IconStar",
      updatedAt: iso,
      items: [
        { id: id(), title: "Instagram caption — Linen apron launch", content: "this apron has been two years in the making.\n\nwe tested 14 linen weights before landing on this one — heavy enough to protect, soft enough to forget you're wearing it.\n\ndyed with plant-based pigments in small batches. gets softer with every wash.\n\nlink in bio.", metadata: { platform: "Instagram", engagement: "890 likes" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Email — Spring collection announcement", content: "Subject: spring is almost here (and so is something new)\n\nThe days are getting longer. The soil is warming up. And we've been busy.\n\nOur Spring collection drops March 15 — ceramic planters, herb garden kits, and our best-selling linen towels in three new colors inspired by early spring blooms.", metadata: { platform: "Email", type: "Launch" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "anti-examples",
      label: "Anti-Examples",
      icon: "IconAlertTriangle",
      updatedAt: iso,
      items: [
        { id: id(), title: "Guilt-based messaging", content: '"Stop poisoning your family with toxic cleaning products!" — We never use fear or shame to sell.', metadata: { issue: "Tone" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Greenwashing vagueness", content: '"Our eco-friendly products are good for the planet!" — Too vague. What materials? What certifications? Be specific.', metadata: { issue: "Specificity" }, createdAt: iso, updatedAt: iso },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Product/Service Descriptions",
      icon: "IconPackage",
      updatedAt: iso,
      items: [
        { id: id(), title: "Heritage Linen Apron", content: "Made from 100% European flax linen, plant-dyed in small batches. Features an adjustable crossback strap (no neck strain), two deep pockets, and a reinforced loop for your kitchen towel. Gets softer with every wash.", metadata: { price: "$68", category: "Kitchen" }, createdAt: iso, updatedAt: iso },
        { id: id(), title: "Windowsill Herb Kit", content: "Everything you need to grow basil, thyme, and cilantro on your windowsill. Includes three handmade ceramic pots, organic seed packets, coconut coir soil, and a 12-page growing guide written for beginners.", metadata: { price: "$45", category: "Garden" }, createdAt: iso, updatedAt: iso },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

const ntLaunchCampaignId = id();
const ntWeeklyCampaignId = id();
const brSpringCampaignId = id();
const brStoriesCampaignId = id();

const allCampaigns = [
  {
    id: ntLaunchCampaignId,
    brandId: ntBrandId,
    name: "DevAssist 3.0 Launch",
    description: "Multi-channel launch campaign for DevAssist 3.0 — our biggest release with AI pair programming.",
    status: "active",
    objective: "Drive 5,000 signups in the first week through coordinated content across X, LinkedIn, blog, email, and YouTube.",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    platforms: ["x", "linkedin", "website", "newsletter", "youtube"],
    contentPillars: ["Product launch", "Technical depth", "Developer productivity", "Social proof"],
  },
  {
    id: ntWeeklyCampaignId,
    brandId: ntBrandId,
    name: "Weekly Dev Tips",
    description: "Ongoing weekly series sharing developer productivity tips using NovaTech tools.",
    status: "active",
    objective: "Build thought leadership and organic following through consistent, high-value developer tips.",
    startDate: "2026-03-01",
    endDate: null,
    platforms: ["x", "linkedin"],
    contentPillars: ["Developer tips", "Productivity", "Best practices"],
  },
  {
    id: brSpringCampaignId,
    brandId: brBrandId,
    name: "Spring 2026 Collection",
    description: "Launch campaign for the Spring garden collection — organic seeds, biodegradable planters, and heirloom starter kits.",
    status: "active",
    objective: "Generate 500 pre-orders and 2,000 email signups for the Spring collection drop on March 15.",
    startDate: "2026-03-01",
    endDate: "2026-04-15",
    platforms: ["instagram", "facebook", "newsletter", "website", "tiktok"],
    contentPillars: ["New collection", "Seasonal gardening", "Sustainability", "Community"],
  },
  {
    id: brStoriesCampaignId,
    brandId: brBrandId,
    name: "Sustainability Stories",
    description: "Evergreen content series sharing sustainability tips, behind-the-scenes stories, and customer spotlights.",
    status: "active",
    objective: "Build brand trust and community engagement through authentic storytelling.",
    startDate: "2026-03-01",
    endDate: null,
    platforms: ["instagram", "linkedin", "newsletter"],
    contentPillars: ["Behind the scenes", "Customer stories", "Sustainability impact"],
  },
];

// ═══════════════════════════════════════════════════════════════
// STORYBOARDS + FRAMES (cross-referenced to campaigns)
// ═══════════════════════════════════════════════════════════════

interface FrameSeed {
  id: string;
  title: string;
  contentType: string;
  platform: string;
  brief: string;
  calendarDate: string;
}

interface StoryboardSeed {
  id: string;
  brandId: string;
  campaignId: string;
  name: string;
  description: string;
  frames: FrameSeed[];
}

// ── NovaTech Storyboards ──────────────────────────────────────

const ntLaunchSb: StoryboardSeed = {
  id: id(),
  brandId: ntBrandId,
  campaignId: ntLaunchCampaignId,
  name: "DevAssist 3.0 Launch Content",
  description: "Core launch content pieces for the DevAssist 3.0 release across all channels.",
  frames: [
    { id: id(), title: "Launch Day Announcement", contentType: "social-post", platform: "x", brief: "Announce DevAssist 3.0 with AI pair programming. Highlight the key feature: real-time code suggestions powered by our new LLM engine. Keep it punchy and dev-friendly.", calendarDate: "2026-03-03" },
    { id: id(), title: "Engineering Deep Dive Post", contentType: "social-post", platform: "linkedin", brief: "LinkedIn post aimed at engineering leaders. Explain how DevAssist 3.0 reduces onboarding time by 40% based on beta data. Professional tone, data-driven.", calendarDate: "2026-03-04" },
    { id: id(), title: "Introducing DevAssist 3.0 Blog Post", contentType: "blog-article", platform: "website", brief: "Long-form blog post (1500-2000 words) covering what's new, engineering details, migration guide, and quick-start with code examples.", calendarDate: "2026-03-03" },
    { id: id(), title: "Launch Email to Users", contentType: "email", platform: "newsletter", brief: "Email to existing users announcing the 3.0 upgrade. Emphasize backward compatibility and new features. Include a CTA to upgrade with 30-day free trial.", calendarDate: "2026-03-03" },
    { id: id(), title: "Product Demo Video (2 min)", contentType: "video-script", platform: "youtube", brief: "2-minute YouTube demo: install → first suggestion → AI pair programming → shipping a PR. Senior dev tone, not salesperson.", calendarDate: "2026-03-05" },
    { id: id(), title: "Google Ads — Search Campaign", contentType: "ad-copy", platform: "other", brief: "3 variations of Google Search ads targeting 'AI code assistant', 'developer productivity tool', 'AI pair programming'.", calendarDate: "2026-03-03" },
  ],
};

const ntWeeklySb: StoryboardSeed = {
  id: id(),
  brandId: ntBrandId,
  campaignId: ntWeeklyCampaignId,
  name: "Weekly Dev Tips Series",
  description: "Ongoing weekly social content series sharing developer productivity tips.",
  frames: [
    { id: id(), title: "Tip #1: Keyboard Shortcuts That Ship Code Faster", contentType: "social-post", platform: "x", brief: "Share 5 essential DevAssist keyboard shortcuts most devs don't know. Thread-friendly format.", calendarDate: "2026-03-07" },
    { id: id(), title: "Tip #2: Using AI Context Windows Effectively", contentType: "social-post", platform: "x", brief: "How to structure your codebase so DevAssist's AI gives better suggestions. Practical, actionable.", calendarDate: "2026-03-14" },
    { id: id(), title: "Tip #3: Code Review Automation for Teams", contentType: "social-post", platform: "linkedin", brief: "Setting up automated code reviews with DevAssist. Team productivity angle — target engineering managers.", calendarDate: "2026-03-21" },
    { id: id(), title: "Tip #4: Writing Tests with AI Assistance", contentType: "social-post", platform: "x", brief: "How DevAssist helps write comprehensive test suites. Show before/after of test coverage improvement.", calendarDate: "2026-03-28" },
  ],
};

// ── Bloom & Root Storyboards ──────────────────────────────────

const brSpringSb: StoryboardSeed = {
  id: id(),
  brandId: brBrandId,
  campaignId: brSpringCampaignId,
  name: "Spring Collection Launch",
  description: "Multi-channel content for the Spring 2026 sustainable garden collection.",
  frames: [
    { id: id(), title: "Spring Collection Reveal — Carousel", contentType: "social-post", platform: "instagram", brief: "5-slide Instagram carousel revealing Spring 2026 collection. Hero shot, organic seeds, biodegradable planters, heirloom kits, CTA to shop.", calendarDate: "2026-03-10" },
    { id: id(), title: "#BloomWithUs Community Challenge", contentType: "social-post", platform: "facebook", brief: "Announce community garden challenge. Plant from Spring collection, share progress, tag @bloomandroot, win $100 gift card.", calendarDate: "2026-03-12" },
    { id: id(), title: "Spring Newsletter + Growing Guide", contentType: "email", platform: "newsletter", brief: "Newsletter with 3 featured products, seasonal growing guide for Zone 5-8, 15% early-bird code SPRING26.", calendarDate: "2026-03-08" },
    { id: id(), title: "Beginner's Sustainable Garden Guide", contentType: "blog-article", platform: "website", brief: "SEO blog (1200-1500 words) on starting a sustainable garden. Soil, seeds, planters, composting, month-by-month calendar. Weave in products naturally.", calendarDate: "2026-03-05" },
    { id: id(), title: "60-Second Herb Kit Tutorial", contentType: "video-script", platform: "tiktok", brief: "60-second TikTok: unbox herb kit, fill pot, plant seeds, water, sunlight. Friendly voiceover with on-screen text.", calendarDate: "2026-03-15" },
    { id: id(), title: "Spring Sale Instagram Ad", contentType: "ad-copy", platform: "instagram", brief: "Primary text + headline + description for IG/FB ad. 15% off Spring collection. Target women 25-45 interested in gardening.", calendarDate: "2026-03-10" },
  ],
};

const brStoriesSb: StoryboardSeed = {
  id: id(),
  brandId: brBrandId,
  campaignId: brStoriesCampaignId,
  name: "Sustainability Stories",
  description: "Ongoing series sharing sustainability tips, behind-the-scenes, and customer spotlights.",
  frames: [
    { id: id(), title: "Behind the Scenes — Seed Sourcing", contentType: "social-post", platform: "instagram", brief: "How we source organic, heirloom seeds from small family farms. Tell one farm partner's story. Authentic, transparent.", calendarDate: "2026-03-17" },
    { id: id(), title: "Sustainability Impact Report", contentType: "social-post", platform: "linkedin", brief: "Key stats: 50,000+ biodegradable planters, 200+ farm partnerships, carbon-neutral shipping. Professional but passionate.", calendarDate: "2026-03-20" },
    { id: id(), title: "Customer Spotlight — Maria's Balcony Garden", contentType: "email", platform: "newsletter", brief: "Feature about Maria (32, Portland) who transformed her balcony with our products. Journey, favorites, small-space tips.", calendarDate: "2026-03-25" },
  ],
};

const allStoryboards = [ntLaunchSb, ntWeeklySb, brSpringSb, brStoriesSb];

// ═══════════════════════════════════════════════════════════════
// MEMORIES (per brand)
// ═══════════════════════════════════════════════════════════════

interface MemorySeed {
  type: string;
  source: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
}

const ntMemories: MemorySeed[] = [
  { type: "preference", source: "manual", title: "Technical credibility first", content: "Always lead with technical depth before marketing language. Our audience is developers — they spot fluff instantly. Use concrete metrics, code examples, and real benchmarks over vague claims like 'revolutionary' or 'game-changing'.", tags: ["tone", "copywriting", "developer-audience"], importance: 5 },
  { type: "preference", source: "manual", title: "Short, punchy paragraphs", content: "Keep paragraphs to 2-3 sentences max across all platforms. Use line breaks liberally. Developers skim — make content scannable with headers, bullets, and code blocks.", tags: ["formatting", "readability"], importance: 4 },
  { type: "preference", source: "manual", title: "Dark mode screenshots only", content: "All product screenshots and code examples should use a dark theme. Our users overwhelmingly prefer dark mode and it aligns with our brand aesthetic.", tags: ["visual", "screenshots", "design"], importance: 3 },
  { type: "rejection", source: "manual", title: "No corporate buzzwords", content: "Avoid terms like 'synergy', 'leverage', 'paradigm shift', 'disrupt'. Use plain language: 'works with', 'use', 'change', 'improve'.", tags: ["tone", "vocabulary"], importance: 5 },
  { type: "rejection", source: "auto_rejection", title: "Avoid exclamation marks in headlines", content: "Headlines with exclamation marks were consistently rejected. They feel clickbaity and undermine technical credibility.", tags: ["punctuation", "headlines"], importance: 3 },
  { type: "approval", source: "auto_approval", title: "Thread-style X posts perform well", content: "X posts structured as numbered threads (1/N format) with a hook in the first tweet get 3-5x more engagement than single posts.", tags: ["x", "engagement", "format"], importance: 4 },
  { type: "approval", source: "auto_approval", title: "Before/after code comparisons", content: "Side-by-side before/after code comparisons have been our best-performing content format across LinkedIn, X, and blog.", tags: ["content-format", "code-examples"], importance: 5 },
  { type: "feedback", source: "manual", title: "CTO audience wants ROI data", content: "CTOs and engineering leaders specifically ask for time-saved metrics and ROI calculations. Always include quantifiable benefits.", tags: ["audience", "cto", "metrics"], importance: 4 },
  { type: "feedback", source: "manual", title: "Community prefers tutorials over announcements", content: "Developers engage more with hands-on tutorials and 'how we built X' posts than product announcements. Aim for 3:1 educational to promotional.", tags: ["community", "content-mix"], importance: 3 },
  { type: "learned_style", source: "manual", title: "Opening hook pattern", content: "Best-performing posts start with a relatable developer pain point, e.g., 'You're 3 hours into debugging a null pointer…' Then pivot to the solution.", tags: ["copywriting", "hooks"], importance: 4 },
  { type: "learned_style", source: "manual", title: "LinkedIn post structure", content: "Winning formula: 1) Bold opening, 2) Short story (3-4 lines), 3) Key insight with data, 4) Bullet takeaways, 5) Question CTA. Keep under 1300 chars.", tags: ["linkedin", "structure"], importance: 4 },
];

const brMemories: MemorySeed[] = [
  { type: "preference", source: "manual", title: "Warm, conversational tone", content: "Write as if talking to a friend over tea in the garden. Use 'you' and 'we' frequently. Contractions encouraged. Knowledgeable neighbor, not textbook.", tags: ["tone", "voice"], importance: 5 },
  { type: "preference", source: "manual", title: "Seasonal awareness in all content", content: "Every piece of content should acknowledge the current season. Reference planting zones (focus 5-8) and what's happening in the garden right now.", tags: ["seasonal", "relevance"], importance: 4 },
  { type: "preference", source: "manual", title: "Sustainability without preachiness", content: "Mention sustainability naturally — show, don't lecture. Focus on practical benefits that happen to be sustainable.", tags: ["sustainability", "tone"], importance: 5 },
  { type: "rejection", source: "manual", title: "No fear-based environmental messaging", content: "Avoid doom-and-gloom environmental stats or guilt-tripping. Our approach is hope-forward: focus on the joy of growing.", tags: ["messaging", "tone"], importance: 5 },
  { type: "rejection", source: "auto_rejection", title: "Avoid 'green' and 'eco' as standalone adjectives", content: "Too vague. Instead of 'eco-friendly pots', say 'biodegradable coconut coir pots'. Be specific about materials.", tags: ["vocabulary", "specificity"], importance: 3 },
  { type: "approval", source: "auto_approval", title: "Customer garden photos drive highest engagement", content: "Instagram posts featuring real customer gardens outperform studio shots by 2-4x. Always credit the grower by name and city.", tags: ["instagram", "ugc", "engagement"], importance: 5 },
  { type: "approval", source: "auto_approval", title: "Step-by-step carousel format", content: "Instagram carousels with 5-7 slides showing step-by-step planting instructions perform exceptionally well.", tags: ["instagram", "carousel", "format"], importance: 4 },
  { type: "feedback", source: "manual", title: "Customers want beginner-friendly content", content: "68% of customers identify as beginner or returning gardeners. Briefly explain terms like 'hardening off', 'deadheading', 'companion planting'.", tags: ["audience", "beginner"], importance: 4 },
  { type: "feedback", source: "manual", title: "Packaging unboxing experience matters", content: "Customer emails frequently mention unboxing. Our kraft paper packaging and handwritten-style thank you notes are a big selling point.", tags: ["packaging", "unboxing"], importance: 3 },
  { type: "learned_style", source: "manual", title: "Recipe-style content format", content: "Audience responds well to 'recipe' format: Ingredients (what you need), Instructions (steps), Tips (pro advice), Yield (what to expect).", tags: ["format", "template"], importance: 4 },
  { type: "learned_style", source: "manual", title: "Monthly gardening calendar emails", content: "Monthly 'What to do this month' email has 42% open rate and 8.3% CTR. Structure: 3 tasks, 1 product, 1 customer spotlight, 1 seasonal recipe.", tags: ["email", "newsletter", "template"], importance: 5 },
];

// ═══════════════════════════════════════════════════════════════
// RUN SEED
// ═══════════════════════════════════════════════════════════════

async function run() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║    Seeding ALL modules               ║");
  console.log("╚══════════════════════════════════════╝\n");

  // 1. Clear everything (order matters for FK-like references)
  await db.delete(calendarEvents);
  await db.delete(frames);
  await db.delete(brandMemories);
  await db.delete(storyboards);
  await db.delete(campaigns);
  await db.delete(brandKits);
  console.log("Cleared all tables\n");

  // 2. Brands
  for (const brand of [novatechBrand, bloomBrand]) {
    await db.insert(brandKits).values({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      data: brand,
      createdAt: new Date(brand.createdAt),
      updatedAt: new Date(brand.updatedAt),
    });
    console.log(`Brand: ${brand.name} (${brand.id})`);
  }

  // 3. Campaigns
  for (const c of allCampaigns) {
    await db.insert(campaigns).values({
      id: c.id,
      brandId: c.brandId,
      name: c.name,
      description: c.description,
      status: c.status,
      objective: c.objective,
      startDate: c.startDate,
      endDate: c.endDate,
      platforms: c.platforms,
      contentPillars: c.contentPillars,
      data: {},
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  Campaign: ${c.name}`);
  }

  // 4. Storyboards + Frames + Calendar Events
  let totalFrames = 0;
  let totalEvents = 0;

  for (const sb of allStoryboards) {
    // Build legacy items array for the storyboard data blob
    const legacyItems = sb.frames.map((f) => ({
      id: f.id,
      contentType: f.contentType,
      platform: f.platform,
      title: f.title,
      brief: f.brief,
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: iso,
      updatedAt: iso,
    }));

    const sbData = {
      id: sb.id,
      brandId: sb.brandId,
      campaignId: sb.campaignId,
      name: sb.name,
      description: sb.description,
      createdAt: iso,
      updatedAt: iso,
      items: legacyItems,
    };

    await db.insert(storyboards).values({
      id: sb.id,
      brandId: sb.brandId,
      campaignId: sb.campaignId,
      name: sb.name,
      description: sb.description,
      status: "draft",
      data: sbData,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  Storyboard: ${sb.name} (${sb.frames.length} frames)`);

    // Insert frames into relational table + calendar events
    for (let i = 0; i < sb.frames.length; i++) {
      const f = sb.frames[i];

      await db.insert(frames).values({
        id: f.id,
        storyboardId: sb.id,
        brandId: sb.brandId,
        campaignId: sb.campaignId,
        title: f.title,
        contentType: f.contentType,
        platform: f.platform,
        status: "planned",
        scheduledDate: date(f.calendarDate),
        sortOrder: i,
        data: { brief: f.brief },
        createdAt: now,
        updatedAt: now,
      });
      totalFrames++;

      // Create a calendar event linked to this frame + campaign
      await db.insert(calendarEvents).values({
        id: id(),
        brandId: sb.brandId,
        frameId: f.id,
        campaignId: sb.campaignId,
        title: f.title,
        platform: JSON.stringify([f.platform]),
        scheduledAt: date(f.calendarDate),
        status: "planned",
        data: {},
        createdAt: now,
        updatedAt: now,
      });
      totalEvents++;
    }
  }

  // 5. Extra standalone calendar events (not tied to frames)
  const standaloneEvents = [
    { brandId: ntBrandId, title: "Team All-Hands: Content Review", platform: "other", day: "2026-03-15" },
    { brandId: ntBrandId, title: "Quarterly Developer Survey", platform: "newsletter", day: "2026-03-31" },
    { brandId: brBrandId, title: "Spring Photo Shoot", platform: "instagram", day: "2026-03-06" },
    { brandId: brBrandId, title: "Monthly Newsletter Send", platform: "newsletter", day: "2026-03-01" },
  ];

  for (const e of standaloneEvents) {
    await db.insert(calendarEvents).values({
      id: id(),
      brandId: e.brandId,
      title: e.title,
      platform: JSON.stringify([e.platform]),
      scheduledAt: date(e.day),
      status: "planned",
      data: {},
      createdAt: now,
      updatedAt: now,
    });
    totalEvents++;
  }

  console.log(`\n  Total frames: ${totalFrames}`);
  console.log(`  Total calendar events: ${totalEvents}`);

  // 6. Memories with embeddings
  const memorySets = [
    { brandId: ntBrandId, brandName: "NovaTech", memories: ntMemories },
    { brandId: brBrandId, brandName: "Bloom & Root", memories: brMemories },
  ];

  let totalMemories = 0;
  for (const { brandId, brandName, memories } of memorySets) {
    console.log(`\n  Memories for ${brandName}:`);
    const texts = memories.map((m) => `${m.title}\n${m.content}`);

    let embeddings: number[][] = [];
    try {
      console.log(`    Generating ${texts.length} embeddings...`);
      embeddings = await embedBatch(texts);
      console.log(`    Embeddings ready (${embeddings[0]?.length || 0} dims)`);
    } catch (err) {
      console.error(`    Embedding failed:`, err);
      embeddings = texts.map(() => []);
    }

    for (let i = 0; i < memories.length; i++) {
      const m = memories[i];
      const emb = embeddings[i]?.length > 0 ? embeddings[i] : null;
      await db.insert(brandMemories).values({
        id: id(),
        brandId,
        type: m.type,
        source: m.source,
        title: m.title,
        content: m.content,
        tags: m.tags,
        importance: m.importance,
        embedding: emb,
        data: {},
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`    + ${memories.length} memories`);
    totalMemories += memories.length;
  }

  console.log("\n╔══════════════════════════════════════╗");
  console.log(`║  Done! Summary:                      ║`);
  console.log(`║  2 brands                            ║`);
  console.log(`║  ${allCampaigns.length} campaigns                          ║`);
  console.log(`║  ${allStoryboards.length} storyboards                       ║`);
  console.log(`║  ${totalFrames} frames                            ║`);
  console.log(`║  ${totalEvents} calendar events                   ║`);
  console.log(`║  ${totalMemories} memories with embeddings         ║`);
  console.log("╚══════════════════════════════════════╝");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
