import { createDb } from "./index";
import { storyboards } from "./schema";
import { nanoid } from "nanoid";
import type { Storyboard } from "../src/types/storyboard";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = createDb(DATABASE_URL);

const now = new Date().toISOString();

// ── NovaTech Storyboards ─────────────────────────────────

const novatechBrandId = "Rq3GfZxYy4IyTF3Skm7Dt";

const novatechLaunch: Storyboard = {
  id: nanoid(),
  brandId: novatechBrandId,
  name: "DevAssist 3.0 Launch Campaign",
  description:
    "Multi-channel launch campaign for DevAssist 3.0 — our biggest release yet with AI pair programming.",
  createdAt: now,
  updatedAt: now,
  items: [
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "x",
      title: "Launch Day Announcement",
      brief:
        "Announce DevAssist 3.0 with AI pair programming. Highlight the key feature: real-time code suggestions powered by our new LLM engine. Keep it punchy, dev-friendly, and include a link to the changelog. Use technical credibility but stay accessible.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "linkedin",
      title: "Engineering Deep Dive Post",
      brief:
        "LinkedIn post aimed at engineering leaders and CTOs. Explain how DevAssist 3.0 reduces onboarding time by 40% based on our beta data. Include a brief case study mention (fictional: Series B startup reduced PR review time). Professional tone, data-driven.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "blog-article",
      platform: "website",
      title: "Introducing DevAssist 3.0: AI Pair Programming for Every Developer",
      brief:
        "Long-form blog post (1500-2000 words) announcing DevAssist 3.0. Cover: what's new (AI pair programming, enhanced code completion, multi-language support), the engineering behind it (LLM fine-tuned on 2M open-source repos), migration guide from 2.x, and a quick-start section with code examples. Technical but approachable.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "email",
      platform: "newsletter",
      title: "DevAssist 3.0 Launch Email to Existing Users",
      brief:
        "Email to existing DevAssist users announcing the 3.0 upgrade. Emphasize backward compatibility, new features they've been requesting (AI pair programming, better TypeScript support), and the upgrade path. Include a CTA to upgrade now with a 30-day free trial of Pro features. Warm, appreciative tone — thank them for being early adopters.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "ad-copy",
      platform: "other",
      title: "Google Ads — DevAssist 3.0 Search Campaign",
      brief:
        "Write 3 variations of Google Search ads (30-char headlines x3, 90-char descriptions x2). Target keywords: 'AI code assistant', 'developer productivity tool', 'AI pair programming'. Focus on speed, accuracy, and the free tier.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "video-script",
      platform: "youtube",
      title: "DevAssist 3.0 Product Demo (2 min)",
      brief:
        "Script for a 2-minute YouTube product demo. Show: install → first suggestion → AI pair programming in action → shipping a PR. Narrator should sound like a senior dev explaining to a peer, not a salesperson. Include on-screen text annotations for key moments.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const novatechWeekly: Storyboard = {
  id: nanoid(),
  brandId: novatechBrandId,
  name: "Weekly Dev Tips Series",
  description:
    "Ongoing weekly social content series sharing developer productivity tips using NovaTech tools.",
  createdAt: now,
  updatedAt: now,
  items: [
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "x",
      title: "Tip #1: Keyboard Shortcuts That Ship Code Faster",
      brief:
        "Share 5 essential DevAssist keyboard shortcuts that most developers don't know. Format as a thread-friendly post. Include the shortcuts and what they do. Playful but useful.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "x",
      title: "Tip #2: Using AI Context Windows Effectively",
      brief:
        "Explain how to structure your codebase so DevAssist's AI gives better suggestions. Practical advice: keep files focused, use clear naming, add JSDoc comments. Make it actionable in a single post.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "linkedin",
      title: "Tip #3: Code Review Automation for Teams",
      brief:
        "LinkedIn post about setting up automated code reviews with DevAssist for engineering teams. Focus on the team productivity angle — less back-and-forth, faster merges, consistent code quality. Target: engineering managers.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
  ],
};

// ── Bloom & Root Storyboards ─────────────────────────────

const bloomBrandId = "Df9Z_b7LMi19bTk55WJje";

const bloomSpring: Storyboard = {
  id: nanoid(),
  brandId: bloomBrandId,
  name: "Spring Garden Collection Launch",
  description:
    "Campaign for the new Spring 2026 sustainable garden collection — organic seeds, biodegradable planters, and heirloom starter kits.",
  createdAt: now,
  updatedAt: now,
  items: [
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "instagram",
      title: "Spring Collection Reveal — Carousel Post",
      brief:
        "Instagram carousel caption (5 slides) revealing the Spring 2026 collection. Slide 1: hero shot hook. Slides 2-4: highlight organic seed packs, biodegradable planters, and heirloom starter kits. Slide 5: CTA to shop. Warm, earthy tone. Use gardening metaphors. Include relevant hashtags.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "facebook",
      title: "Community Garden Challenge Kickoff",
      brief:
        "Announce the #BloomWithUs community garden challenge. Invite followers to plant something from the Spring collection and share their progress. Warm, community-focused tone. Include rules: post a photo, tag @bloomandroot, use hashtag, win a $100 gift card.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "email",
      platform: "newsletter",
      title: "Spring Newsletter — New Collection + Growing Guide",
      brief:
        "Monthly newsletter announcing the Spring collection. Include: hero image description, 3 featured products with descriptions, a seasonal growing guide for Zone 5-8, and a 15% early-bird discount code (SPRING26). Warm, knowledgeable tone — like a letter from a gardening friend.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "blog-article",
      platform: "website",
      title: "The Beginner's Guide to Starting a Sustainable Garden in 2026",
      brief:
        "SEO-focused blog post (1200-1500 words) targeting beginners interested in sustainable gardening. Cover: choosing the right soil, organic vs conventional seeds, biodegradable planters, composting basics, and a month-by-month planting calendar. Naturally weave in Bloom & Root products as recommendations without being pushy.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "video-script",
      platform: "tiktok",
      title: "60-Second Planting Tutorial — Herb Starter Kit",
      brief:
        "Script for a 60-second TikTok showing how to use the Bloom & Root Herb Starter Kit. Steps: unbox, fill biodegradable pot, plant seeds, water, place in sun. Voiceover should be friendly and encouraging. End with 'Tag us when your first sprout appears!' Include on-screen text overlays for each step.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "ad-copy",
      platform: "instagram",
      title: "Spring Sale Instagram Ad",
      brief:
        "Write primary text, headline, and description for an Instagram/Facebook ad promoting the Spring collection with 15% off. Target: women 25-45 interested in gardening, sustainability, home decor. Emphasize sustainability, ease of use, and beautiful results. Warm and inviting.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const bloomEvergreen: Storyboard = {
  id: nanoid(),
  brandId: bloomBrandId,
  name: "Evergreen Content — Sustainability Stories",
  description:
    "Ongoing content series sharing sustainability tips, behind-the-scenes stories, and customer spotlights.",
  createdAt: now,
  updatedAt: now,
  items: [
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "instagram",
      title: "Behind the Scenes — Our Seed Sourcing Story",
      brief:
        "Instagram post about how Bloom & Root sources organic, heirloom seeds from small family farms. Tell the story of one specific farm partner. Authentic, transparent tone. Include a quote from the farmer if possible (make up a realistic one).",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "social-post",
      platform: "linkedin",
      title: "Sustainability Impact Report Highlights",
      brief:
        "LinkedIn post sharing key stats from our annual sustainability report: 50,000+ biodegradable planters sold (saving X lbs of plastic), 200+ family farm partnerships, carbon-neutral shipping since 2025. Professional but passionate tone. Target: B2B partnerships and conscious consumers.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      contentType: "email",
      platform: "newsletter",
      title: "Customer Spotlight — Maria's Balcony Garden",
      brief:
        "Newsletter feature about a customer (fictional: Maria, 32, apartment dweller in Portland) who transformed her tiny balcony into a thriving garden using Bloom & Root products. Include her journey, favorite products, tips for small-space gardening. Warm, inspirational tone. CTA: share your garden story.",
      status: "draft",
      generatedContent: "",
      promptUsed: "",
      createdAt: now,
      updatedAt: now,
    },
  ],
};

// ── Run seed ─────────────────────────────────────────────

async function seed() {
  console.log("Seeding storyboards...\n");

  const allStoryboards = [
    novatechLaunch,
    novatechWeekly,
    bloomSpring,
    bloomEvergreen,
  ];

  for (const sb of allStoryboards) {
    await db.insert(storyboards).values({
      id: sb.id,
      brandId: sb.brandId,
      name: sb.name,
      description: sb.description,
      data: sb,
      createdAt: new Date(sb.createdAt),
      updatedAt: new Date(sb.updatedAt),
    });
    console.log(`  ✓ ${sb.name} (${sb.items.length} items)`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);
