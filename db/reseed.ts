/**
 * Comprehensive reseed script.
 * Clears ALL tables and reseeds brands, storyboards, campaigns, platform specs,
 * templates, brand memories (with vector embeddings), and calendar events.
 *
 * Every entry is tied to a specific brand — no shared data between brands.
 * Platform specs are the only exception (reference data with no brandId column).
 *
 * Usage: bun run db/reseed.ts
 * Requires: DATABASE_URL + OPENAI_API_KEY env vars (or .env file)
 */

import { createDb } from "./index";
import {
  brandKits,
  storyboards,
  campaigns,
  frames,
  briefs,
  socialCopies,
  hashtagSets,
  brandMemories,
  assets,
  templates,
  platformSpecs,
  calendarEvents,
  contentExports,
  activityLog,
  settings,
  designs,
} from "./schema";
import { nanoid } from "nanoid";

// ─── Env setup ──────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL not set. Set it in your environment or .env file."
  );
  process.exit(1);
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn(
    "⚠  OPENAI_API_KEY not set — memories will be seeded WITHOUT embeddings."
  );
}

const db = createDb(DATABASE_URL);
const now = new Date().toISOString();

// ─── Embedding helper (standalone, no import.meta.env) ──────────

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY || texts.length === 0) {
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
    console.error(`OpenAI Embedding API error (${res.status}): ${body}`);
    return texts.map(() => []);
  }

  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

// ─── STEP 1: Clear all tables ──────────────────────────────────

async function clearAll() {
  console.log("Clearing all tables...");
  await db.delete(activityLog);
  await db.delete(contentExports);
  await db.delete(calendarEvents);
  await db.delete(hashtagSets);
  await db.delete(socialCopies);
  await db.delete(briefs);
  await db.delete(assets);
  await db.delete(designs);
  await db.delete(frames);
  await db.delete(storyboards);
  await db.delete(campaigns);
  await db.delete(brandMemories);
  await db.delete(templates);
  await db.delete(platformSpecs);
  await db.delete(settings);
  await db.delete(brandKits);
  console.log("  All tables cleared.\n");
}

// ─── STEP 2: Build brand data ───────────────────────────────────

const brand1Id = nanoid();
const brand2Id = nanoid();

interface SectionData {
  kind: "document" | "list";
  id: string;
  label: string;
  icon: string;
  updatedAt: string;
  content?: string;
  items?: {
    id: string;
    title: string;
    content: string;
    metadata: Record<string, string>;
    createdAt: string;
    updatedAt: string;
  }[];
}

function buildBrand1Sections(): SectionData[] {
  return [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice Document",
      icon: "IconMicrophone",
      updatedAt: now,
      content: `# NovaTech Brand Voice\n\n## Tone\n- **Confident but not arrogant** — We know our stuff but stay humble\n- **Technical but accessible** — Explain complex ideas simply\n- **Direct and concise** — Respect the reader's time\n\n## Personality\nWe sound like a senior engineer who also happens to be a great communicator.\n\n## Do's\n- Use active voice\n- Lead with the benefit\n- Use code examples when helpful\n\n## Don'ts\n- Never say "revolutionary" or "game-changing"\n- Avoid corporate buzzwords\n- Don't talk down to the reader`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: now,
      content: `# Messaging Framework\n\n## Value Proposition\nNovaTech gives developers AI tools that understand their codebase — so they ship faster without sacrificing quality.\n\n## Key Messages\n1. Speed without shortcuts — Ship 3x faster\n2. Your patterns, amplified — AI that learns your conventions\n3. Privacy-first — Your code never leaves your infrastructure\n\n## Tagline\n"Code smarter. Ship faster."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide",
      icon: "IconPencil",
      updatedAt: now,
      content: `# Style Guide\n\n- Sentence case for all headings\n- Oxford comma always\n- Numbers: spell out 1-9, use numerals for 10+\n- "AI" not "A.I."\n- Headlines: 6-10 words max`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity",
      icon: "IconPalette",
      updatedAt: now,
      content: `# Visual Identity\n\n## Colors\n- Primary: #6366F1 (Indigo)\n- Secondary: #0F172A (Slate 900)\n- Accent: #22D3EE (Cyan)\n\n## Typography\n- Headings: Inter, semibold\n- Body: Inter, regular\n- Code: JetBrains Mono`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audiences",
      icon: "IconUsers",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Senior Full-Stack Developer",
          content:
            "10+ years experience. Uses VS Code, TypeScript, React. Cares deeply about code quality.",
          metadata: { role: "IC Engineer" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Engineering Manager",
          content:
            "Manages 5-15 engineers. Focused on velocity and quality metrics.",
          metadata: { role: "Manager" },
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
          title: "Launch Tweet Example",
          content:
            "We just shipped CodeLens 2.0.\n\nIt reads your codebase, learns your patterns, and catches bugs before your tests do.\n\nNo cloud. No telemetry. Just your code, understood.\n\nTry it free →",
          metadata: { platform: "X/Twitter" },
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
          title: "Too Salesy",
          content:
            "🚀 REVOLUTIONARY AI TOOL 🚀 Game-changing technology that will DISRUPT the entire developer ecosystem!!! Sign up NOW!!!",
          metadata: { reason: "Hype language, all caps, excessive punctuation" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Products",
      icon: "IconPackage",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "CodeLens",
          content:
            "AI-powered code review that understands your codebase. Catches bugs, suggests improvements.",
          metadata: { pricing: "$29/seat/mo", status: "GA" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "FlowCI",
          content:
            "Intelligent CI/CD pipeline optimization. Cuts pipeline time by 60%.",
          metadata: { pricing: "$49/seat/mo", status: "Beta" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ];
}

function buildBrand2Sections(): SectionData[] {
  return [
    {
      kind: "document",
      id: "brand-voice",
      label: "Brand Voice",
      icon: "IconMicrophone",
      updatedAt: now,
      content: `# Bloom & Root Brand Voice\n\n## Tone\n- Warm and inviting\n- Grounded and honest\n- Gently educational\n\n## Language\n- Use "we" and "you"\n- Sensory language: textures, scents, colors\n- Seasonal references`,
    },
    {
      kind: "document",
      id: "messaging-framework",
      label: "Messaging Framework",
      icon: "IconMessage",
      updatedAt: now,
      content: `# Messaging\n\n## Value Proposition\nBeautiful, toxin-free home and garden products that you'll actually want to use every day.\n\n## Key Messages\n1. Beauty meets intention\n2. Gentle on everything\n3. Built to last\n\n## Tagline\n"Rooted in care."`,
    },
    {
      kind: "document",
      id: "style-guide",
      label: "Style Guide",
      icon: "IconPencil",
      updatedAt: now,
      content: `# Style Guide\n\n- Title case for product names\n- Lowercase for descriptions unless sentence start\n- Use em dashes — not hyphens\n- Spell out all numbers under 20\n- Use sensory words: "lush", "sun-warmed", "handcrafted"`,
    },
    {
      kind: "document",
      id: "visual-identity",
      label: "Visual Identity",
      icon: "IconPalette",
      updatedAt: now,
      content: `# Visual Identity\n\n## Colors\n- Primary: #5B7553 (Sage)\n- Secondary: #F5F0EB (Cream)\n- Accent: #C8A87C (Gold)\n\n## Photography\n- Natural light, golden hour\n- Real home settings\n- Earth tones, linen textures`,
    },
    {
      kind: "list",
      id: "target-audiences",
      label: "Target Audiences",
      icon: "IconUsers",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "The Intentional Homemaker",
          content:
            "30-45, homeowner. Shops at farmers markets. Willing to pay more for quality and sustainability.",
          metadata: { age: "30-45" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "The New Gardener",
          content:
            "25-35, first home with small yard. Excited about growing food but intimidated.",
          metadata: { age: "25-35" },
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
          title: "Instagram Caption Example",
          content:
            "There's something about slipping on a linen apron first thing in the morning.\n\nIt says: I'm here. I'm present. Let's make something beautiful today.\n\nOur Heritage Apron — plant-dyed, European flax, built to soften with every wash. 🌿",
          metadata: { platform: "Instagram" },
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
          title: "Too Corporate",
          content:
            "Bloom & Root leverages sustainable supply chain synergies to deliver best-in-class home and garden solutions to our target demographic.",
          metadata: { reason: "Corporate jargon, no warmth or personality" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      kind: "list",
      id: "products",
      label: "Products",
      icon: "IconPackage",
      updatedAt: now,
      items: [
        {
          id: nanoid(),
          title: "Heritage Linen Apron",
          content:
            "100% European flax linen, plant-dyed. Crossback strap, two deep pockets.",
          metadata: { price: "$68" },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: nanoid(),
          title: "Windowsill Herb Kit",
          content:
            "Three ceramic pots, organic seeds, coconut coir soil, growing guide.",
          metadata: { price: "$45" },
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ];
}

function buildBrand(
  id: string,
  name: string,
  description: string,
  sections: SectionData[]
) {
  return { id, name, description, createdAt: now, updatedAt: now, sections };
}

// ─── Seed brands ────────────────────────────────────────────────

async function seedBrands() {
  console.log("Seeding brands...");

  const brand1Sections = buildBrand1Sections();
  const brand2Sections = buildBrand2Sections();

  const brand1 = buildBrand(
    brand1Id,
    "NovaTech",
    "AI-powered developer tools",
    brand1Sections
  );
  const brand2 = buildBrand(
    brand2Id,
    "Bloom & Root",
    "Sustainable home and garden essentials",
    brand2Sections
  );

  for (const brand of [brand1, brand2]) {
    await db.insert(brandKits).values({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      data: brand,
      createdAt: new Date(brand.createdAt),
      updatedAt: new Date(brand.updatedAt),
    });
    console.log(`  + ${brand.name}`);
  }
  console.log();
}

// ─── Seed brand memories with embeddings ────────────────────────

function sectionToText(section: SectionData): string {
  if (section.kind === "document") {
    return section.content ?? "";
  }
  return (section.items ?? [])
    .map((item) => `${item.title}\n${item.content}`)
    .join("\n\n");
}

const SECTION_MEMORY_TYPE: Record<string, string> = {
  "brand-voice": "preference",
  "messaging-framework": "preference",
  "style-guide": "preference",
  "visual-identity": "preference",
  "target-audiences": "preference",
  "content-examples": "approval",
  "anti-examples": "rejection",
  products: "preference",
};

const SECTION_TAGS: Record<string, string[]> = {
  "brand-voice": ["vault", "voice", "tone"],
  "messaging-framework": ["vault", "messaging"],
  "style-guide": ["vault", "style", "rules"],
  "visual-identity": ["vault", "visual", "design"],
  "target-audiences": ["vault", "audience"],
  "content-examples": ["vault", "examples", "approved"],
  "anti-examples": ["vault", "anti-examples", "avoid"],
  products: ["vault", "products"],
};

async function seedBrandMemories(
  brandId: string,
  brandName: string,
  sections: SectionData[]
) {
  console.log(`  Syncing vault → memories for ${brandName}...`);

  const memoriesData: {
    id: string;
    title: string;
    content: string;
    type: string;
    tags: string[];
    sectionId: string;
  }[] = [];

  for (const section of sections) {
    const content = sectionToText(section);
    if (content.trim().length === 0) continue;

    memoriesData.push({
      id: `vs-${nanoid(8)}`,
      title: section.label,
      content,
      type: SECTION_MEMORY_TYPE[section.id] ?? "preference",
      tags: SECTION_TAGS[section.id] ?? ["vault"],
      sectionId: section.id,
    });
  }

  // Generate embeddings in batch
  const texts = memoriesData.map((m) => `${m.title}\n${m.content}`);
  let embeddings: number[][] = [];
  try {
    embeddings = await generateEmbeddings(texts);
    const withEmbeddings = embeddings.filter((e) => e.length > 0).length;
    console.log(
      `    Generated ${withEmbeddings}/${texts.length} embeddings`
    );
  } catch (err) {
    console.error("    Embedding generation failed:", err);
    embeddings = texts.map(() => []);
  }

  // Insert memories
  for (let i = 0; i < memoriesData.length; i++) {
    const m = memoriesData[i];
    const embedding = embeddings[i]?.length > 0 ? embeddings[i] : null;

    await db.insert(brandMemories).values({
      id: m.id,
      brandId,
      type: m.type,
      source: "vault_sync",
      title: m.title,
      content: m.content,
      tags: m.tags,
      importance: 5,
      embedding,
      data: { sectionId: m.sectionId },
      isActive: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  }
  console.log(`    + ${memoriesData.length} memories for ${brandName}`);
}

async function seedMemories() {
  console.log("Seeding brand memories with embeddings...");
  await seedBrandMemories(brand1Id, "NovaTech", buildBrand1Sections());
  await seedBrandMemories(brand2Id, "Bloom & Root", buildBrand2Sections());
  console.log();
}

// ─── Seed campaigns ─────────────────────────────────────────────

const campaign1Id = nanoid();
const campaign2Id = nanoid();

async function seedCampaigns() {
  console.log("Seeding campaigns...");

  await db.insert(campaigns).values({
    id: campaign1Id,
    brandId: brand1Id,
    name: "DevAssist 3.0 Launch",
    description: "Multi-channel launch campaign for DevAssist 3.0",
    status: "active",
    objective: "Drive 1,000 signups in the first week",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    platforms: ["x", "linkedin", "youtube"],
    contentPillars: [
      "Product Launch",
      "Technical Deep Dive",
      "Customer Success",
    ],
    data: {},
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });
  console.log("  + DevAssist 3.0 Launch (NovaTech)");

  await db.insert(campaigns).values({
    id: campaign2Id,
    brandId: brand2Id,
    name: "Spring Garden Collection",
    description: "Campaign for Spring 2026 sustainable garden collection",
    status: "draft",
    objective: "Increase spring collection sales by 30%",
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    platforms: ["instagram", "facebook", "tiktok"],
    contentPillars: ["Sustainability", "How-To Guides", "Customer Stories"],
    data: {},
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });
  console.log("  + Spring Garden Collection (Bloom & Root)\n");
}

// ─── Seed storyboards ───────────────────────────────────────────

const sb1Id = nanoid();
const sb2Id = nanoid();
const sb3Id = nanoid();

async function seedStoryboards() {
  console.log("Seeding storyboards...");

  const sbs = [
    {
      id: sb1Id,
      brandId: brand1Id,
      campaignId: campaign1Id,
      name: "DevAssist 3.0 Launch Content",
      description: "Launch day content across all channels",
      status: "draft",
      sortOrder: 0,
      items: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: sb2Id,
      brandId: brand1Id,
      campaignId: null,
      name: "Weekly Dev Tips Series",
      description: "Ongoing weekly social content series",
      status: "draft",
      sortOrder: 1,
      items: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: sb3Id,
      brandId: brand2Id,
      campaignId: campaign2Id,
      name: "Spring Collection Launch",
      description:
        "Multi-platform launch for Spring 2026 garden collection",
      status: "draft",
      sortOrder: 0,
      items: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const sb of sbs) {
    await db.insert(storyboards).values({
      id: sb.id,
      brandId: sb.brandId,
      campaignId: sb.campaignId,
      name: sb.name,
      description: sb.description,
      status: sb.status,
      sortOrder: sb.sortOrder,
      data: sb,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
    console.log(`  + ${sb.name}`);
  }
  console.log();
}

// ─── Stable frame IDs (referenced by designs + activity log) ────

const frame1Id = nanoid(); // Launch Day Tweet
const frame2Id = nanoid(); // LinkedIn Deep Dive Post
const frame3Id = nanoid(); // Product Demo Video Script
const frame4Id = nanoid(); // Launch Blog Post
const frame5Id = nanoid(); // Tip #1: Keyboard Shortcuts
const frame6Id = nanoid(); // Tip #2: AI Context Windows
const frame7Id = nanoid(); // Collection Reveal Carousel
const frame8Id = nanoid(); // Planting Tutorial TikTok
const frame9Id = nanoid(); // Spring Newsletter
const frame10Id = nanoid(); // Community Garden Challenge

// ─── Seed frames ────────────────────────────────────────────────

async function seedFrames() {
  console.log("Seeding frames...");

  const frameData = [
    // DevAssist Launch frames — mixed statuses for campaign progress bar
    {
      id: frame1Id,
      storyboardId: sb1Id,
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Launch Day Tweet",
      contentType: "social-post",
      platform: "x",
      status: "approved",
      sortOrder: 0,
      data: {
        brief:
          "Announce DevAssist 3.0 with AI pair programming. Hook in first line.",
        generatedContent:
          "We just shipped DevAssist 3.0.\n\nIt pairs with you while you code — not after. Real-time suggestions that actually understand your codebase, your patterns, your style.\n\nNo cloud roundtrips. No latency. Just your IDE, supercharged.\n\nTry it free today: devassist.dev/3.0\n\n#DevAssist #AI #DeveloperTools",
      },
    },
    {
      id: frame2Id,
      storyboardId: sb1Id,
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "LinkedIn Deep Dive Post",
      contentType: "social-post",
      platform: "linkedin",
      status: "approved",
      sortOrder: 1,
      data: {
        brief:
          "Engineering leader focused post about DevAssist 3.0 reducing onboarding time by 40%.",
        generatedContent:
          "We measured onboarding time across 50 engineering teams.\n\nTeams using DevAssist 3.0 got new hires to their first meaningful PR 40% faster.\n\nHere's why:\n\nDevAssist doesn't just autocomplete code. It understands your team's conventions, your architecture patterns, and your internal APIs. When a new engineer opens a file, DevAssist provides contextual guidance based on how your team actually writes code.\n\nNo more \"just read the codebase\" onboarding.\nNo more outdated wiki pages.\nNo more 3-week ramp-up periods.\n\nThe result: New engineers ship production code in their first week.\n\nWe're offering free team pilots through March. Link in comments.\n\n#EngineeringLeadership #DevTools #AI",
      },
    },
    {
      id: frame3Id,
      storyboardId: sb1Id,
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Product Demo Video Script",
      contentType: "video-script",
      platform: "youtube",
      status: "published",
      sortOrder: 2,
      data: {
        brief:
          "2-minute product demo: install -> first suggestion -> AI pair programming in action.",
        generatedContent:
          "[INTRO - 0:00]\nHey, I'm going to show you DevAssist 3.0 in under two minutes.\n\n[INSTALL - 0:10]\nOne command. That's it. `npx devassist init` — it scans your project structure and builds a local model of your codebase.\n\n[FIRST SUGGESTION - 0:30]\nI'm opening a new file. Watch — before I type anything, DevAssist already knows this is a React component that should follow our team's composition pattern.\n\n[AI PAIR PROGRAMMING - 1:00]\nNow here's where it gets interesting. I'm going to ask DevAssist to help me refactor this API handler. It knows our error handling conventions, our logging patterns, and our test structure.\n\n[CLOSING - 1:45]\nThat's DevAssist 3.0. Your codebase, understood. Try it free at devassist.dev.",
      },
    },
    {
      id: frame4Id,
      storyboardId: sb1Id,
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Launch Blog Post",
      contentType: "blog-article",
      platform: "website",
      status: "planned",
      sortOrder: 3,
      data: {
        brief:
          "Long-form blog post announcing DevAssist 3.0 features and architecture.",
      },
    },
    // Weekly Tips frames — mixed statuses
    {
      id: frame5Id,
      storyboardId: sb2Id,
      brandId: brand1Id,
      campaignId: null,
      title: "Tip #1: Keyboard Shortcuts",
      contentType: "social-post",
      platform: "x",
      status: "approved",
      sortOrder: 0,
      data: {
        brief:
          "Share 5 essential DevAssist keyboard shortcuts most devs don't know.",
        generatedContent:
          "5 DevAssist shortcuts that will change your workflow:\n\n1. Cmd+Shift+A — Ask AI about selected code\n2. Cmd+K — Inline code generation\n3. Cmd+Shift+R — Refactor with context\n4. Cmd+J — Jump to related test\n5. Cmd+Shift+D — Generate docstring\n\nBookmark this. You'll thank me later.\n\n#DevTips #Productivity",
      },
    },
    {
      id: frame6Id,
      storyboardId: sb2Id,
      brandId: brand1Id,
      campaignId: null,
      title: "Tip #2: AI Context Windows",
      contentType: "social-post",
      platform: "x",
      status: "draft",
      sortOrder: 1,
      data: {
        brief:
          "How to structure your codebase for better AI suggestions.",
      },
    },
    // Bloom & Root Spring frames — mixed statuses
    {
      id: frame7Id,
      storyboardId: sb3Id,
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Collection Reveal Carousel",
      contentType: "social-post",
      platform: "instagram",
      status: "published",
      sortOrder: 0,
      data: {
        brief:
          "5-slide carousel revealing Spring 2026 collection. Hook -> products -> CTA.",
        generatedContent:
          "Slide 1: Spring is almost here — and so is something beautiful.\n\nSlide 2: Introducing our Spring 2026 Collection. Handcrafted garden tools, plant-dyed linens, and heirloom seed kits — all made with intention.\n\nSlide 3: The Heritage Linen Apron — European flax, crossback straps, two deep pockets. Gets softer with every wash.\n\nSlide 4: The Windowsill Herb Kit — three ceramic pots, organic seeds, coconut coir soil, and a growing guide for beginners.\n\nSlide 5: Shop the full collection. Link in bio. Use SPRING15 for 15% off your first order.",
      },
    },
    {
      id: frame8Id,
      storyboardId: sb3Id,
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Planting Tutorial TikTok",
      contentType: "video-script",
      platform: "tiktok",
      status: "approved",
      sortOrder: 1,
      data: {
        brief:
          "60-second TikTok showing how to use the Herb Starter Kit.",
        generatedContent:
          "[0:00] POV: You just got your Bloom & Root Herb Kit\n\n[0:05] First, fill each ceramic pot with the coconut coir soil — it expands when you add water, so start with a little\n\n[0:15] Now the fun part. Drop 3-4 seeds into each pot. We're planting basil, thyme, and cilantro today\n\n[0:25] Cover lightly with soil. Mist with water — don't soak\n\n[0:35] Place on your sunniest windowsill. These little guys need 6+ hours of light\n\n[0:45] Water every 2-3 days. In two weeks, you'll see sprouts\n\n[0:55] Follow for more growing tips. Link in bio for the kit!",
      },
    },
    {
      id: frame9Id,
      storyboardId: sb3Id,
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Spring Newsletter",
      contentType: "email",
      platform: "newsletter",
      status: "approved",
      sortOrder: 2,
      data: {
        brief:
          "Monthly newsletter with collection announcement, growing guide, and 15% discount.",
      },
    },
    {
      id: frame10Id,
      storyboardId: sb3Id,
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Community Garden Challenge",
      contentType: "social-post",
      platform: "facebook",
      status: "planned",
      sortOrder: 3,
      data: {
        brief:
          "#BloomWithUs community garden challenge. Post a photo, tag us, win $100.",
      },
    },
  ];

  for (const f of frameData) {
    await db.insert(frames).values({
      id: f.id,
      storyboardId: f.storyboardId,
      brandId: f.brandId,
      campaignId: f.campaignId,
      title: f.title,
      contentType: f.contentType,
      platform: f.platform,
      status: f.status,
      sortOrder: f.sortOrder,
      data: f.data,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
    console.log(`  + ${f.title} [${f.status}]`);
  }
  console.log();
}

// ─── Seed platform specs (shared reference data) ────────────────

async function seedPlatformSpecs() {
  console.log("Seeding platform specs...");

  const specsData = [
    // Instagram
    {
      platform: "instagram",
      format: "feed-post",
      name: "Feed Post (Square)",
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      maxFileSize: 30_000_000,
      captionLimit: 2200,
      hashtagLimit: 30,
      supportedFormats: ["jpg", "png"],
      rules: ["High-quality images", "Minimal text overlay"],
    },
    {
      platform: "instagram",
      format: "feed-portrait",
      name: "Feed Post (Portrait)",
      width: 1080,
      height: 1350,
      aspectRatio: "4:5",
      maxFileSize: 30_000_000,
      captionLimit: 2200,
      hashtagLimit: 30,
      supportedFormats: ["jpg", "png"],
      rules: ["Takes up more screen space"],
    },
    {
      platform: "instagram",
      format: "story",
      name: "Story",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxFileSize: 30_000_000,
      maxDuration: 60,
      supportedFormats: ["jpg", "png", "mp4"],
      rules: ["Keep text in safe zone"],
    },
    {
      platform: "instagram",
      format: "reel",
      name: "Reel",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxFileSize: 250_000_000,
      maxDuration: 90,
      captionLimit: 2200,
      hashtagLimit: 30,
      supportedFormats: ["mp4", "mov"],
      rules: ["Hook in first 3 seconds", "Add captions"],
    },
    {
      platform: "instagram",
      format: "carousel",
      name: "Carousel",
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      maxFileSize: 30_000_000,
      captionLimit: 2200,
      hashtagLimit: 30,
      supportedFormats: ["jpg", "png"],
      rules: ["Up to 10 slides", "First slide is the hook"],
    },
    // X
    {
      platform: "x",
      format: "tweet-image",
      name: "Tweet with Image",
      width: 1200,
      height: 675,
      aspectRatio: "16:9",
      maxFileSize: 5_000_000,
      captionLimit: 280,
      hashtagLimit: 5,
      supportedFormats: ["jpg", "png", "gif"],
      rules: ["Keep tweets concise"],
    },
    {
      platform: "x",
      format: "tweet-video",
      name: "Tweet with Video",
      width: 1280,
      height: 720,
      aspectRatio: "16:9",
      maxFileSize: 512_000_000,
      maxDuration: 140,
      captionLimit: 280,
      hashtagLimit: 5,
      supportedFormats: ["mp4"],
      rules: ["Add captions"],
    },
    // LinkedIn
    {
      platform: "linkedin",
      format: "feed-image",
      name: "Feed Image",
      width: 1200,
      height: 627,
      aspectRatio: "1.91:1",
      maxFileSize: 10_000_000,
      captionLimit: 3000,
      hashtagLimit: 10,
      supportedFormats: ["jpg", "png"],
      rules: ["Professional tone", "First 2 lines visible"],
    },
    {
      platform: "linkedin",
      format: "article",
      name: "Article",
      captionLimit: 120000,
      supportedFormats: ["text"],
      rules: ["Long-form professional content"],
    },
    // Facebook
    {
      platform: "facebook",
      format: "feed-image",
      name: "Feed Image",
      width: 1200,
      height: 630,
      aspectRatio: "1.91:1",
      maxFileSize: 30_000_000,
      captionLimit: 63206,
      hashtagLimit: 10,
      supportedFormats: ["jpg", "png"],
      rules: ["Less than 20% text on image for ads"],
    },
    {
      platform: "facebook",
      format: "story",
      name: "Story",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxFileSize: 30_000_000,
      maxDuration: 20,
      supportedFormats: ["jpg", "png", "mp4"],
      rules: ["Keep text in safe zone"],
    },
    // TikTok
    {
      platform: "tiktok",
      format: "video",
      name: "Video",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxFileSize: 287_000_000,
      maxDuration: 600,
      captionLimit: 2200,
      hashtagLimit: 10,
      supportedFormats: ["mp4", "mov"],
      rules: ["Hook in first 1-2 seconds", "Vertical only"],
    },
    // YouTube
    {
      platform: "youtube",
      format: "video",
      name: "Standard Video",
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      maxFileSize: 2_000_000_000,
      captionLimit: 5000,
      hashtagLimit: 15,
      supportedFormats: ["mp4", "mov", "avi"],
      rules: ["Custom thumbnail required", "Max 256GB upload"],
    },
    {
      platform: "youtube",
      format: "short",
      name: "YouTube Short",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxDuration: 60,
      captionLimit: 100,
      hashtagLimit: 15,
      supportedFormats: ["mp4"],
      rules: ["Max 60 seconds", "Vertical format"],
    },
    {
      platform: "youtube",
      format: "thumbnail",
      name: "Thumbnail",
      width: 1280,
      height: 720,
      aspectRatio: "16:9",
      maxFileSize: 2_000_000,
      supportedFormats: ["jpg", "png"],
      rules: ["Bold text, high contrast", "Readable at small sizes"],
    },
  ];

  for (const spec of specsData) {
    await db.insert(platformSpecs).values({
      id: nanoid(),
      platform: spec.platform,
      format: spec.format,
      name: spec.name,
      width: (spec as Record<string, unknown>).width as number ?? null,
      height: (spec as Record<string, unknown>).height as number ?? null,
      aspectRatio: (spec as Record<string, unknown>).aspectRatio as string ?? null,
      maxFileSize: (spec as Record<string, unknown>).maxFileSize as number ?? null,
      maxDuration: (spec as Record<string, unknown>).maxDuration as number ?? null,
      captionLimit: (spec as Record<string, unknown>).captionLimit as number ?? null,
      hashtagLimit: (spec as Record<string, unknown>).hashtagLimit as number ?? null,
      supportedFormats: spec.supportedFormats,
      rules: spec.rules,
      data: {},
      updatedAt: new Date(now),
    });
  }
  console.log(`  + ${specsData.length} platform specs (shared reference data)\n`);
}

// ─── Seed templates (per brand, no shared) ──────────────────────

async function seedTemplates() {
  console.log("Seeding templates...");

  const templateData = [
    {
      name: "Instagram Carousel",
      category: "social",
      platform: "instagram",
      description: "10-slide carousel with hook and CTA",
      usageCount: 24,
    },
    {
      name: "X Thread",
      category: "social",
      platform: "x",
      description: "Numbered posts with engagement hooks",
      usageCount: 18,
    },
    {
      name: "Weekly Newsletter",
      category: "email",
      platform: null,
      description: "Roundup email with news, tips, and CTA",
      usageCount: 12,
    },
    {
      name: "SEO Blog Post",
      category: "blog",
      platform: null,
      description: "Long-form with SEO best practices",
      usageCount: 7,
    },
    {
      name: "LinkedIn Thought Leadership",
      category: "social",
      platform: "linkedin",
      description: "Professional post for thought leadership",
      usageCount: 15,
    },
    {
      name: "Facebook Ad Copy",
      category: "ad",
      platform: "facebook",
      description: "Headline, body, and CTA variations",
      usageCount: 3,
    },
    {
      name: "Product Launch Email",
      category: "email",
      platform: null,
      description: "Email sequence for product launches",
      usageCount: 0,
    },
    {
      name: "How-To Guide",
      category: "blog",
      platform: null,
      description: "Step-by-step tutorial template",
      usageCount: 0,
    },
  ];

  // Create templates for EACH brand — no shared/null brandId
  const brands = [
    { id: brand1Id, name: "NovaTech" },
    { id: brand2Id, name: "Bloom & Root" },
  ];

  let count = 0;
  for (const brand of brands) {
    for (const t of templateData) {
      await db.insert(templates).values({
        id: nanoid(),
        brandId: brand.id,
        name: t.name,
        category: t.category,
        platform: t.platform ?? null,
        format: null,
        data: { description: t.description, usageCount: t.usageCount ?? 0 },
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
      count++;
    }
    console.log(`  + ${templateData.length} templates for ${brand.name}`);
  }
  console.log(`  Total: ${count} templates\n`);
}

// ─── Seed calendar events (per brand) ───────────────────────────

function todayAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function seedCalendarEvents() {
  console.log("Seeding calendar events...");

  const events = [
    // ── NovaTech: future/scheduled events ──
    {
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Demo Video Premiere",
      platform: "youtube",
      scheduledAt: new Date("2026-03-03T16:00:00Z"),
      status: "planned",
      data: {},
    },
    {
      brandId: brand1Id,
      campaignId: null,
      title: "Weekly Dev Tip #1",
      platform: "x",
      scheduledAt: new Date("2026-03-05T12:00:00Z"),
      status: "planned",
      data: {},
    },

    // ── NovaTech: TODAY's events (for Dashboard Today's Tasks) ──
    {
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "DevAssist 3.0 Launch Tweet",
      platform: "x",
      scheduledAt: todayAt(9, 0),
      status: "done",
      data: { postingTimes: ["09:00"] },
    },
    {
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "LinkedIn Launch Post",
      platform: "linkedin",
      scheduledAt: todayAt(11, 30),
      status: "done",
      data: { postingTimes: ["11:30"] },
    },
    {
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Product Hunt Launch",
      platform: "website",
      scheduledAt: todayAt(14, 0),
      status: "planned",
      data: { postingTimes: ["14:00"] },
    },
    {
      brandId: brand1Id,
      campaignId: campaign1Id,
      title: "Evening Follow-Up Thread",
      platform: "x",
      scheduledAt: todayAt(18, 0),
      status: "planned",
      data: { postingTimes: ["18:00"] },
    },
    {
      brandId: brand1Id,
      campaignId: null,
      title: "Community AMA Announcement",
      platform: "linkedin",
      scheduledAt: todayAt(20, 0),
      status: "planned",
      data: {},
    },

    // ── Bloom & Root: future/scheduled events ──
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Spring Collection Teaser",
      platform: "instagram",
      scheduledAt: new Date("2026-03-10T09:00:00Z"),
      status: "planned",
      data: {},
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Collection Reveal Carousel",
      platform: "instagram",
      scheduledAt: new Date("2026-03-15T10:00:00Z"),
      status: "planned",
      data: {},
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Herb Kit Tutorial",
      platform: "tiktok",
      scheduledAt: new Date("2026-03-17T15:00:00Z"),
      status: "planned",
      data: {},
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Spring Newsletter Send",
      platform: "newsletter",
      scheduledAt: new Date("2026-03-20T08:00:00Z"),
      status: "planned",
      data: {},
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Community Garden Challenge Launch",
      platform: "facebook",
      scheduledAt: new Date("2026-03-22T11:00:00Z"),
      status: "planned",
      data: {},
    },

    // ── Bloom & Root: TODAY's events (for Dashboard Today's Tasks) ──
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Morning Instagram Story — Spring Sneak Peek",
      platform: "instagram",
      scheduledAt: todayAt(8, 0),
      status: "done",
      data: { postingTimes: ["08:00"] },
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Herb Garden Tips Reel",
      platform: "instagram",
      scheduledAt: todayAt(12, 0),
      status: "planned",
      data: { postingTimes: ["12:00", "17:00"] },
    },
    {
      brandId: brand2Id,
      campaignId: campaign2Id,
      title: "Facebook Community Poll",
      platform: "facebook",
      scheduledAt: todayAt(15, 0),
      status: "planned",
      data: { postingTimes: ["15:00"] },
    },
    {
      brandId: brand2Id,
      campaignId: null,
      title: "TikTok Behind-the-Scenes",
      platform: "tiktok",
      scheduledAt: todayAt(19, 0),
      status: "planned",
      data: {},
    },
  ];

  for (const evt of events) {
    await db.insert(calendarEvents).values({
      id: nanoid(),
      brandId: evt.brandId,
      campaignId: evt.campaignId,
      title: evt.title,
      platform: evt.platform,
      scheduledAt: evt.scheduledAt,
      status: evt.status,
      data: evt.data,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
    console.log(`  + ${evt.title} [${evt.status}]`);
  }
  console.log();
}

// ─── Seed activity log (30-50 realistic entries) ────────────────

function daysAgo(days: number, hours = 12, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function seedActivityLog() {
  console.log("Seeding activity log...");

  const entries: {
    brandId: string;
    entityType: string;
    entityId: string | null;
    action: string;
    data: { description: string };
    createdAt: Date;
  }[] = [
    // ── Day 0 (today) ──
    {
      brandId: brand1Id,
      entityType: "campaign",
      entityId: campaign1Id,
      action: "updated",
      data: { description: "Updated campaign: DevAssist 3.0 Launch — set status to active" },
      createdAt: daysAgo(0, 9, 15),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame1Id,
      action: "generated",
      data: { description: "Generated content for frame: Launch Day Tweet" },
      createdAt: daysAgo(0, 9, 30),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame1Id,
      action: "updated",
      data: { description: "Approved frame: Launch Day Tweet" },
      createdAt: daysAgo(0, 10, 0),
    },
    {
      brandId: brand1Id,
      entityType: "calendar_event",
      entityId: null,
      action: "updated",
      data: { description: "Marked as done: DevAssist 3.0 Launch Tweet" },
      createdAt: daysAgo(0, 10, 5),
    },
    {
      brandId: brand2Id,
      entityType: "calendar_event",
      entityId: null,
      action: "updated",
      data: { description: "Marked as done: Morning Instagram Story — Spring Sneak Peek" },
      createdAt: daysAgo(0, 8, 30),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame7Id,
      action: "generated",
      data: { description: "Generated content for frame: Collection Reveal Carousel" },
      createdAt: daysAgo(0, 11, 0),
    },

    // ── Day 1 (yesterday) ──
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame2Id,
      action: "generated",
      data: { description: "Generated content for frame: LinkedIn Deep Dive Post" },
      createdAt: daysAgo(1, 10, 0),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame2Id,
      action: "updated",
      data: { description: "Approved frame: LinkedIn Deep Dive Post" },
      createdAt: daysAgo(1, 11, 30),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame3Id,
      action: "generated",
      data: { description: "Generated content for frame: Product Demo Video Script" },
      createdAt: daysAgo(1, 14, 0),
    },
    {
      brandId: brand1Id,
      entityType: "design",
      entityId: null,
      action: "created",
      data: { description: "Created design: DevAssist Launch Tweet Visual" },
      createdAt: daysAgo(1, 15, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame8Id,
      action: "generated",
      data: { description: "Generated content for frame: Planting Tutorial TikTok" },
      createdAt: daysAgo(1, 9, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame8Id,
      action: "updated",
      data: { description: "Approved frame: Planting Tutorial TikTok" },
      createdAt: daysAgo(1, 10, 30),
    },

    // ── Day 2 ──
    {
      brandId: brand1Id,
      entityType: "storyboard",
      entityId: sb1Id,
      action: "created",
      data: { description: "Created storyboard: DevAssist 3.0 Launch Content" },
      createdAt: daysAgo(2, 9, 0),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame1Id,
      action: "created",
      data: { description: "Created frame: Launch Day Tweet" },
      createdAt: daysAgo(2, 9, 15),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame2Id,
      action: "created",
      data: { description: "Created frame: LinkedIn Deep Dive Post" },
      createdAt: daysAgo(2, 9, 20),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame3Id,
      action: "created",
      data: { description: "Created frame: Product Demo Video Script" },
      createdAt: daysAgo(2, 9, 25),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame4Id,
      action: "created",
      data: { description: "Created frame: Launch Blog Post" },
      createdAt: daysAgo(2, 9, 30),
    },
    {
      brandId: brand2Id,
      entityType: "storyboard",
      entityId: sb3Id,
      action: "created",
      data: { description: "Created storyboard: Spring Collection Launch" },
      createdAt: daysAgo(2, 10, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame7Id,
      action: "created",
      data: { description: "Created frame: Collection Reveal Carousel" },
      createdAt: daysAgo(2, 10, 15),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame8Id,
      action: "created",
      data: { description: "Created frame: Planting Tutorial TikTok" },
      createdAt: daysAgo(2, 10, 20),
    },

    // ── Day 3 ──
    {
      brandId: brand1Id,
      entityType: "campaign",
      entityId: campaign1Id,
      action: "created",
      data: { description: "Created campaign: DevAssist 3.0 Launch" },
      createdAt: daysAgo(3, 8, 0),
    },
    {
      brandId: brand1Id,
      entityType: "memory",
      entityId: null,
      action: "created",
      data: { description: "Synced vault section: Brand Voice Document to memory" },
      createdAt: daysAgo(3, 9, 0),
    },
    {
      brandId: brand1Id,
      entityType: "memory",
      entityId: null,
      action: "created",
      data: { description: "Synced vault section: Messaging Framework to memory" },
      createdAt: daysAgo(3, 9, 5),
    },
    {
      brandId: brand1Id,
      entityType: "template",
      entityId: null,
      action: "created",
      data: { description: "Created template: X Thread" },
      createdAt: daysAgo(3, 11, 0),
    },
    {
      brandId: brand2Id,
      entityType: "campaign",
      entityId: campaign2Id,
      action: "created",
      data: { description: "Created campaign: Spring Garden Collection" },
      createdAt: daysAgo(3, 10, 0),
    },
    {
      brandId: brand2Id,
      entityType: "memory",
      entityId: null,
      action: "created",
      data: { description: "Synced vault section: Brand Voice to memory" },
      createdAt: daysAgo(3, 10, 15),
    },

    // ── Day 4 ──
    {
      brandId: brand1Id,
      entityType: "storyboard",
      entityId: sb2Id,
      action: "created",
      data: { description: "Created storyboard: Weekly Dev Tips Series" },
      createdAt: daysAgo(4, 14, 0),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame5Id,
      action: "created",
      data: { description: "Created frame: Tip #1: Keyboard Shortcuts" },
      createdAt: daysAgo(4, 14, 15),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame6Id,
      action: "created",
      data: { description: "Created frame: Tip #2: AI Context Windows" },
      createdAt: daysAgo(4, 14, 20),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame5Id,
      action: "generated",
      data: { description: "Generated content for frame: Tip #1: Keyboard Shortcuts" },
      createdAt: daysAgo(4, 15, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame9Id,
      action: "created",
      data: { description: "Created frame: Spring Newsletter" },
      createdAt: daysAgo(4, 11, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame10Id,
      action: "created",
      data: { description: "Created frame: Community Garden Challenge" },
      createdAt: daysAgo(4, 11, 15),
    },

    // ── Day 5 ──
    {
      brandId: brand1Id,
      entityType: "design",
      entityId: null,
      action: "exported",
      data: { description: "Exported design: DevAssist Launch Tweet Visual as PNG" },
      createdAt: daysAgo(5, 16, 0),
    },
    {
      brandId: brand1Id,
      entityType: "frame",
      entityId: frame3Id,
      action: "updated",
      data: { description: "Published frame: Product Demo Video Script" },
      createdAt: daysAgo(5, 17, 0),
    },
    {
      brandId: brand2Id,
      entityType: "design",
      entityId: null,
      action: "created",
      data: { description: "Created design: Spring Carousel Slide 1" },
      createdAt: daysAgo(5, 10, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame7Id,
      action: "updated",
      data: { description: "Published frame: Collection Reveal Carousel" },
      createdAt: daysAgo(5, 14, 0),
    },

    // ── Day 6 ──
    {
      brandId: brand1Id,
      entityType: "memory",
      entityId: null,
      action: "updated",
      data: { description: "Updated vault section: Visual Identity — added new accent color" },
      createdAt: daysAgo(6, 10, 0),
    },
    {
      brandId: brand1Id,
      entityType: "template",
      entityId: null,
      action: "updated",
      data: { description: "Updated template: LinkedIn Thought Leadership — added intro hook section" },
      createdAt: daysAgo(6, 11, 0),
    },
    {
      brandId: brand2Id,
      entityType: "memory",
      entityId: null,
      action: "updated",
      data: { description: "Updated vault section: Style Guide — added em dash rule" },
      createdAt: daysAgo(6, 9, 0),
    },
    {
      brandId: brand2Id,
      entityType: "template",
      entityId: null,
      action: "created",
      data: { description: "Created template: Instagram Carousel for Bloom & Root" },
      createdAt: daysAgo(6, 12, 0),
    },
    {
      brandId: brand2Id,
      entityType: "frame",
      entityId: frame9Id,
      action: "updated",
      data: { description: "Approved frame: Spring Newsletter" },
      createdAt: daysAgo(6, 15, 0),
    },

    // ── Day 7 ──
    {
      brandId: brand1Id,
      entityType: "campaign",
      entityId: campaign1Id,
      action: "updated",
      data: { description: "Updated campaign: DevAssist 3.0 Launch — added YouTube to platforms" },
      createdAt: daysAgo(7, 8, 30),
    },
    {
      brandId: brand2Id,
      entityType: "campaign",
      entityId: campaign2Id,
      action: "updated",
      data: { description: "Updated campaign: Spring Garden Collection — extended end date to May 15" },
      createdAt: daysAgo(7, 9, 0),
    },
    {
      brandId: brand2Id,
      entityType: "design",
      entityId: null,
      action: "exported",
      data: { description: "Exported design: Spring Carousel Slide 1 as PNG" },
      createdAt: daysAgo(7, 16, 0),
    },
  ];

  for (const entry of entries) {
    await db.insert(activityLog).values({
      id: nanoid(),
      brandId: entry.brandId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      data: entry.data,
      createdAt: entry.createdAt,
    });
  }
  console.log(`  + ${entries.length} activity log entries (spanning 7 days)\n`);
}

// ─── Seed designs (linked to specific frames) ──────────────────

async function seedDesigns() {
  console.log("Seeding designs...");

  const designData = [
    {
      brandId: brand1Id,
      frameId: frame1Id,
      name: "DevAssist Launch Tweet Visual",
      platform: "x",
      format: "tweet-image",
      width: 1200,
      height: 675,
      status: "approved",
      data: { description: "Dark gradient background with DevAssist 3.0 logo and tagline" },
    },
    {
      brandId: brand1Id,
      frameId: frame2Id,
      name: "LinkedIn Launch Header Image",
      platform: "linkedin",
      format: "feed-image",
      width: 1200,
      height: 627,
      status: "in_progress",
      data: { description: "Professional header with onboarding stats infographic" },
    },
    {
      brandId: brand2Id,
      frameId: frame7Id,
      name: "Spring Carousel — Slide 1",
      platform: "instagram",
      format: "carousel",
      width: 1080,
      height: 1080,
      status: "exported",
      data: { description: "Warm golden-hour photo of spring garden collection spread on linen tablecloth" },
    },
    {
      brandId: brand2Id,
      frameId: frame8Id,
      name: "Herb Kit Tutorial Thumbnail",
      platform: "tiktok",
      format: "video",
      width: 1080,
      height: 1920,
      status: "draft",
      data: { description: "Overhead shot of herb kit components with step numbers overlay" },
    },
  ];

  for (const d of designData) {
    await db.insert(designs).values({
      id: nanoid(),
      brandId: d.brandId,
      frameId: d.frameId,
      name: d.name,
      platform: d.platform,
      format: d.format,
      width: d.width,
      height: d.height,
      status: d.status,
      canvasJson: {},
      data: d.data,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
    console.log(`  + ${d.name} [${d.status}]`);
  }
  console.log();
}

// ─── Run everything ─────────────────────────────────────────────

async function reseed() {
  console.log("=== Brand Content Studio — Full Reseed ===\n");

  await clearAll();
  await seedBrands();
  await seedMemories();
  await seedCampaigns();
  await seedStoryboards();
  await seedFrames();
  await seedDesigns();
  await seedPlatformSpecs();
  await seedTemplates();
  await seedCalendarEvents();
  await seedActivityLog();

  console.log("=== Reseed complete! ===");
  console.log("  2 brands (fully isolated)");
  console.log("  16 brand memories with vector embeddings");
  console.log("  2 campaigns");
  console.log("  3 storyboards, 10 frames (mixed statuses + generated content)");
  console.log("  4 designs (linked to specific frames)");
  console.log("  15 platform specs (shared reference data)");
  console.log("  16 templates (8 per brand, with usage counts)");
  console.log("  16 calendar events (9 scheduled today for Dashboard)");
  console.log("  44 activity log entries (spanning 7 days)");
  console.log("\nNo shared data between brands (except platform specs).");
}

reseed().catch((err) => {
  console.error("Reseed failed:", err);
  process.exit(1);
});
