/**
 * Seed brand memories with OpenAI embeddings.
 * Usage: bun run db/seed-memories.ts
 */

import { createDb } from "./index";
import { brandMemories, brandKits } from "./schema";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY (or VITE_OPENAI_API_KEY) not set.");
  process.exit(1);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
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

const db = createDb(DATABASE_URL);
const now = new Date();

interface MemorySeed {
  type: string;
  source: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
}

// ─── NovaTech memories ──────────────────────────────────────────

const novatechMemories: MemorySeed[] = [
  // Preferences
  {
    type: "preference",
    source: "manual",
    title: "Technical credibility first",
    content:
      "Always lead with technical depth before marketing language. Our audience is developers — they spot fluff instantly. Use concrete metrics, code examples, and real benchmarks over vague claims like 'revolutionary' or 'game-changing'.",
    tags: ["tone", "copywriting", "developer-audience"],
    importance: 5,
  },
  {
    type: "preference",
    source: "manual",
    title: "Short, punchy paragraphs",
    content:
      "Keep paragraphs to 2-3 sentences max across all platforms. Use line breaks liberally. Developers skim — make content scannable with headers, bullets, and code blocks where appropriate.",
    tags: ["formatting", "readability"],
    importance: 4,
  },
  {
    type: "preference",
    source: "manual",
    title: "Dark mode screenshots only",
    content:
      "All product screenshots and code examples should use a dark theme. Our users overwhelmingly prefer dark mode and it aligns with our brand aesthetic. VS Code Dark+ or One Dark Pro themes preferred.",
    tags: ["visual", "screenshots", "design"],
    importance: 3,
  },

  // Rejections
  {
    type: "rejection",
    source: "manual",
    title: "No corporate buzzwords",
    content:
      "Avoid terms like 'synergy', 'leverage', 'paradigm shift', 'disrupt', 'ecosystem play'. These were flagged in three separate review cycles. Use plain language: 'works with', 'use', 'change', 'improve'.",
    tags: ["tone", "vocabulary", "review-feedback"],
    importance: 5,
  },
  {
    type: "rejection",
    source: "auto_rejection",
    title: "Avoid exclamation marks in headlines",
    content:
      "Headlines with exclamation marks were consistently rejected by the editorial team. They feel clickbaity and undermine our technical credibility. Use periods or no punctuation for headlines.",
    tags: ["punctuation", "headlines", "editorial"],
    importance: 3,
  },

  // Approvals
  {
    type: "approval",
    source: "auto_approval",
    title: "Thread-style X posts perform well",
    content:
      "X posts structured as numbered threads (1/N format) with a hook in the first tweet consistently get 3-5x more engagement than single posts. Always include a practical takeaway or code snippet in the thread.",
    tags: ["x", "engagement", "format"],
    importance: 4,
  },
  {
    type: "approval",
    source: "auto_approval",
    title: "Before/after code comparisons",
    content:
      "Side-by-side before/after code comparisons showing DevAssist suggestions have been our best-performing content format. The 'without DevAssist → with DevAssist' format works across LinkedIn, X, and blog posts.",
    tags: ["content-format", "code-examples", "high-performance"],
    importance: 5,
  },

  // Feedback
  {
    type: "feedback",
    source: "manual",
    title: "CTO audience wants ROI data",
    content:
      "Feedback from sales team: CTOs and engineering leaders specifically ask for time-saved metrics and ROI calculations. Always include at least one quantifiable benefit (e.g., '40% faster onboarding', '2.3 fewer review cycles').",
    tags: ["audience", "cto", "metrics", "sales-feedback"],
    importance: 4,
  },
  {
    type: "feedback",
    source: "manual",
    title: "Community prefers tutorials over announcements",
    content:
      "Discord and GitHub Discussions feedback: developers engage more with hands-on tutorials and 'how we built X' posts than product announcements. Aim for a 3:1 ratio of educational to promotional content.",
    tags: ["community", "content-mix", "engagement"],
    importance: 3,
  },

  // Learned styles
  {
    type: "learned_style",
    source: "manual",
    title: "Opening hook pattern",
    content:
      "Our best-performing posts start with a relatable developer pain point, e.g., 'You're 3 hours into debugging a null pointer…' or 'Every senior dev knows: the real code review happens in the commit message.' Then pivot to the solution.",
    tags: ["copywriting", "hooks", "pattern"],
    importance: 4,
  },
  {
    type: "learned_style",
    source: "manual",
    title: "LinkedIn post structure",
    content:
      "Winning LinkedIn formula: 1) Bold opening statement, 2) Short personal/team story (3-4 lines), 3) Key insight with data, 4) Bullet list of actionable takeaways, 5) Question CTA to drive comments. Keep under 1300 chars for full visibility.",
    tags: ["linkedin", "structure", "template"],
    importance: 4,
  },
];

// ─── Bloom & Root memories ──────────────────────────────────────

const bloomMemories: MemorySeed[] = [
  // Preferences
  {
    type: "preference",
    source: "manual",
    title: "Warm, conversational tone",
    content:
      "Write as if talking to a friend over tea in the garden. Use 'you' and 'we' frequently. Contractions are encouraged. The voice should feel like a knowledgeable gardening neighbor, not a textbook or a sales pitch.",
    tags: ["tone", "voice", "brand-personality"],
    importance: 5,
  },
  {
    type: "preference",
    source: "manual",
    title: "Seasonal awareness in all content",
    content:
      "Every piece of content should acknowledge the current season or upcoming seasonal transition. Reference planting zones (focus on 5-8), regional weather patterns, and what's happening in the garden right now. Timeless content should include a 'Best for: [season]' note.",
    tags: ["seasonal", "relevance", "gardening"],
    importance: 4,
  },
  {
    type: "preference",
    source: "manual",
    title: "Sustainability without preachiness",
    content:
      "Mention sustainability naturally — show, don't lecture. Instead of 'You should use biodegradable pots to save the planet', say 'Our biodegradable pots break down right in the soil, feeding your next season's garden.' Focus on practical benefits that happen to be sustainable.",
    tags: ["sustainability", "tone", "messaging"],
    importance: 5,
  },

  // Rejections
  {
    type: "rejection",
    source: "manual",
    title: "No fear-based environmental messaging",
    content:
      "Avoid doom-and-gloom environmental stats or guilt-tripping language. Content about 'the planet is dying' or 'if you don't act now' was rejected by the founder. Our approach is hope-forward: focus on the joy of growing and the positive impact of small actions.",
    tags: ["messaging", "environment", "tone"],
    importance: 5,
  },
  {
    type: "rejection",
    source: "auto_rejection",
    title: "Avoid 'green' and 'eco' as standalone adjectives",
    content:
      "These terms are overused and vague in our market. Instead of 'eco-friendly pots', say 'biodegradable coconut coir pots' or 'compostable seed trays made from recycled paper.' Be specific about materials and processes.",
    tags: ["vocabulary", "specificity", "sustainability"],
    importance: 3,
  },

  // Approvals
  {
    type: "approval",
    source: "auto_approval",
    title: "Customer garden photos drive highest engagement",
    content:
      "Instagram posts featuring real customer gardens (reposted with permission) consistently outperform studio shots by 2-4x in engagement. Always credit the grower by name and location (city only). Ask about their favorite product in the caption.",
    tags: ["instagram", "ugc", "engagement", "photos"],
    importance: 5,
  },
  {
    type: "approval",
    source: "auto_approval",
    title: "Step-by-step carousel format",
    content:
      "Instagram carousels with 5-7 slides showing step-by-step planting instructions perform exceptionally well. Format: Slide 1 = hook/title, Slides 2-6 = one step per slide with photo + short text overlay, Slide 7 = CTA to shop or share results.",
    tags: ["instagram", "carousel", "format", "tutorial"],
    importance: 4,
  },

  // Feedback
  {
    type: "feedback",
    source: "manual",
    title: "Customers want beginner-friendly content",
    content:
      "Survey results: 68% of our customers identify as 'beginner' or 'getting back into gardening'. Avoid assuming knowledge of gardening terms. When using terms like 'hardening off', 'deadheading', or 'companion planting', briefly explain them in context.",
    tags: ["audience", "beginner", "accessibility"],
    importance: 4,
  },
  {
    type: "feedback",
    source: "manual",
    title: "Packaging unboxing experience matters",
    content:
      "Customer emails frequently mention the unboxing experience. Our kraft paper packaging with handwritten-style thank you notes and seed care cards are a big selling point. Feature the packaging in content — it's part of the brand story.",
    tags: ["packaging", "unboxing", "brand-experience"],
    importance: 3,
  },

  // Learned styles
  {
    type: "learned_style",
    source: "manual",
    title: "Recipe-style content format",
    content:
      "Our audience responds well to 'recipe' formatted content for gardening: Ingredients (what you need), Instructions (step-by-step), Tips (pro advice), Yield (what to expect). This format works for blog posts, emails, and even social captions.",
    tags: ["format", "template", "gardening"],
    importance: 4,
  },
  {
    type: "learned_style",
    source: "manual",
    title: "Monthly gardening calendar emails",
    content:
      "The monthly 'What to do in your garden this month' email format has our highest open rate (42%) and click-through rate (8.3%). Structure: 3 tasks for the month, 1 featured product, 1 customer spotlight, 1 seasonal recipe using homegrown ingredients.",
    tags: ["email", "newsletter", "calendar", "template"],
    importance: 5,
  },
];

// ─── Run seed ───────────────────────────────────────────────────

async function run() {
  // Clear existing memories
  await db.delete(brandMemories);
  console.log("Cleared brand_memories\n");

  // Get brands
  const brands = await db.select().from(brandKits);
  if (brands.length === 0) {
    console.error("No brands found. Run the main seed first.");
    process.exit(1);
  }

  // Assign memories to brands — use all available brands
  // First brand gets NovaTech-style memories, second gets Bloom-style
  // If only one brand exists, it gets both sets
  const allSets: { brand: typeof brands[0]; memories: MemorySeed[] }[] = [];

  if (brands.length >= 2) {
    allSets.push({ brand: brands[0], memories: novatechMemories });
    allSets.push({ brand: brands[1], memories: bloomMemories });
  } else {
    // Single brand gets all memories combined
    allSets.push({
      brand: brands[0],
      memories: [...novatechMemories, ...bloomMemories],
    });
  }

  let total = 0;
  for (const { brand, memories } of allSets) {
    console.log(`Seeding memories for: ${brand.name} (${brand.id})`);

    // Generate embeddings in one batch
    const texts = memories.map((m) => `${m.title}\n${m.content}`);
    console.log(`  Generating ${texts.length} embeddings...`);
    const embeddings = await embedBatch(texts);
    console.log(`  Embeddings ready (${embeddings[0].length} dims each)`);

    for (let i = 0; i < memories.length; i++) {
      const m = memories[i];
      await db.insert(brandMemories).values({
        id: nanoid(8),
        brandId: brand.id,
        type: m.type,
        source: m.source,
        title: m.title,
        content: m.content,
        tags: m.tags,
        importance: m.importance,
        embedding: embeddings[i],
        data: {},
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  + ${memories.length} memories with vectors\n`);
    total += memories.length;
  }

  console.log(`Done! ${total} total memories seeded with embeddings.`);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
