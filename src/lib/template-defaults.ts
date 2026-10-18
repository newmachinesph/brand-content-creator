import { nanoid } from "nanoid";
import type { Template } from "@/types/template";

interface DefaultTemplate {
  name: string;
  category: string;
  platforms?: string[];
  description: string;
  structure: string;
}

const DEFAULTS: DefaultTemplate[] = [
  // ─── Social ────────────────────────────────────────────────────
  {
    name: "Instagram Carousel Post",
    category: "social",
    platforms: ["instagram"],
    description:
      "Multi-slide carousel with hook, value slides, and CTA. Ideal for educational or storytelling content.",
    structure:
      "Slide 1: Hook / attention-grabbing headline\nSlides 2-8: Key points or story beats\nFinal Slide: CTA with clear next step\nCaption: Summary + hashtags (up to 30)",
  },
  {
    name: "Instagram Reel Script",
    category: "social",
    platforms: ["instagram", "tiktok"],
    description:
      "Short-form vertical video script with hook-value-CTA structure. 15-60 seconds.",
    structure:
      "Hook (0-3s): Pattern interrupt or bold claim\nBody (3-25s): Deliver the value, tip, or story\nCTA (last 5s): Follow, save, share, or link in bio\nCaption: Brief summary + hashtags",
  },
  {
    name: "Instagram Story Sequence",
    category: "social",
    platforms: ["instagram"],
    description:
      "3-5 frame story sequence for engagement, polls, or announcements.",
    structure:
      "Frame 1: Attention grabber or question\nFrame 2-3: Context or value delivery\nFrame 4: Poll, quiz, or engagement sticker\nFrame 5: CTA or link sticker",
  },
  {
    name: "X (Twitter) Thread",
    category: "social",
    platforms: ["x"],
    description:
      "Multi-tweet thread format for thought leadership or deep dives. 5-10 tweets.",
    structure:
      "Tweet 1: Bold hook + promise of value\nTweets 2-8: One idea per tweet, numbered\nTweet 9: Summary or key takeaway\nTweet 10: CTA (follow, retweet, reply)",
  },
  {
    name: "X (Twitter) Single Post",
    category: "social",
    platforms: ["x"],
    description:
      "Standalone tweet for engagement. 280 characters max.",
    structure:
      "Format options:\n- Hot take / opinion\n- Question to audience\n- Tip or insight\n- Announcement with link\nKeep under 240 chars for retweet room",
  },
  {
    name: "LinkedIn Thought Leadership",
    category: "social",
    platforms: ["linkedin"],
    description:
      "Professional long-form post for authority building. 1,000-1,300 characters.",
    structure:
      "Hook line (curiosity or bold statement)\n\nStory or observation (2-3 short paragraphs)\n\nKey insight or lesson\n\nQuestion to spark discussion\n\n3-5 relevant hashtags",
  },
  {
    name: "LinkedIn Company Update",
    category: "social",
    platforms: ["linkedin"],
    description:
      "Official company announcement or milestone post.",
    structure:
      "Announcement headline\n\nContext and details\n\nImpact or significance\n\nCTA (apply, learn more, visit)\n\nRelevant hashtags",
  },
  {
    name: "Facebook Engagement Post",
    category: "social",
    platforms: ["facebook"],
    description:
      "Community-focused post designed to drive comments and shares.",
    structure:
      "Relatable hook or question\n\nShort story or context (2-3 sentences)\n\nClear question or call for opinions\n\nOptional: Image or video\n\nKeep caption under 500 chars for best reach",
  },
  {
    name: "TikTok Video Script",
    category: "social",
    platforms: ["tiktok", "instagram"],
    description:
      "Vertical short-form video script. 15-60 seconds with trend-friendly format.",
    structure:
      "Hook (0-2s): Stop the scroll\nSetup (2-5s): Context or promise\nBody (5-20s): Value, humor, or story\nPayoff (20-25s): Reveal or conclusion\nCTA: Follow for more, comment, duet\nCaption: Short + trending hashtags",
  },
  {
    name: "YouTube Video Script",
    category: "social",
    platforms: ["youtube"],
    description:
      "Long-form video script structure. 8-15 minutes.",
    structure:
      "Hook (0-30s): Why they should watch\nIntro (30s-1m): Context + what they'll learn\nContent sections (each 2-3 min):\n  - Point 1 with example\n  - Point 2 with example\n  - Point 3 with example\nSummary: Key takeaways\nCTA: Subscribe, like, comment, next video",
  },

  // ─── Email ─────────────────────────────────────────────────────
  {
    name: "Welcome Email Sequence",
    category: "email",
    description:
      "3-email onboarding sequence for new subscribers. Builds trust and sets expectations.",
    structure:
      "Email 1 (Day 0): Welcome + deliver lead magnet\nEmail 2 (Day 2): Brand story + values\nEmail 3 (Day 5): Best content showcase + next steps\n\nEach email: Subject line, preview text, body, CTA button",
  },
  {
    name: "Product Launch Email",
    category: "email",
    description:
      "Announcement email for new product or feature launch.",
    structure:
      "Subject: Curiosity-driven or benefit-led\nPreview text: Expand on subject\n\nBody:\n- Hero image or GIF\n- Headline: What's new\n- 3 key benefits (icon + short text)\n- Social proof or early results\n- Primary CTA button\n- Secondary link",
  },
  {
    name: "Weekly Newsletter",
    category: "email",
    description:
      "Recurring newsletter template with curated content sections.",
    structure:
      "Subject: [Newsletter Name] #XX — Topic\nPreview text: Top story teaser\n\nSections:\n1. Featured story / main article\n2. Quick tips (2-3 bullet points)\n3. Tool or resource of the week\n4. Community spotlight or quote\n5. CTA: Reply, share, or visit",
  },
  {
    name: "Re-engagement Email",
    category: "email",
    description:
      "Win-back email for inactive subscribers.",
    structure:
      "Subject: We miss you / Exclusive offer inside\nPreview text: Special incentive teaser\n\nBody:\n- Personal opening\n- What they've been missing\n- Exclusive offer or incentive\n- One-click re-engage CTA\n- Option to update preferences or unsubscribe",
  },

  // ─── Blog ──────────────────────────────────────────────────────
  {
    name: "How-To Guide",
    category: "blog",
    description:
      "Step-by-step tutorial blog post. 1,500-2,500 words.",
    structure:
      "Title: How to [Achieve Result] in [Timeframe]\n\nIntro: Problem statement + what they'll learn\n\nSteps:\n- Step 1: [Action] — explanation + tip\n- Step 2: [Action] — explanation + tip\n- Step 3-7: Continue pattern\n\nConclusion: Summary + next action\nCTA: Download, subscribe, or related content",
  },
  {
    name: "Listicle Post",
    category: "blog",
    description:
      "Numbered list article. Easy to scan, high engagement format.",
    structure:
      "Title: [Number] [Adjective] [Topic] for [Audience]\n\nIntro: Why this list matters (2-3 sentences)\n\nList items (each):\n- Subheading with number\n- 1-2 paragraph explanation\n- Example or image\n\nBonus item (optional)\n\nConclusion: Top pick recommendation + CTA",
  },
  {
    name: "Case Study",
    category: "blog",
    description:
      "Customer success story with data-driven results.",
    structure:
      "Title: How [Company] Achieved [Result] with [Product]\n\nOverview: Company intro + challenge\n\nChallenge: Specific problems and pain points\n\nSolution: How they implemented your product\n\nResults: Metrics, data, before/after\n\nQuote: Testimonial from stakeholder\n\nCTA: Try it yourself / Get started",
  },
  {
    name: "Opinion / Thought Piece",
    category: "blog",
    description:
      "Perspective-driven article to establish authority.",
    structure:
      "Title: Why [Conventional Wisdom] Is Wrong / The Future of [Topic]\n\nHook: Bold claim or contrarian take\n\nContext: Current state of the industry\n\nArgument: 3 supporting points with evidence\n\nCounter-argument: Address objections\n\nConclusion: Call to rethink + CTA",
  },

  // ─── Ad ────────────────────────────────────────────────────────
  {
    name: "Facebook/Instagram Ad",
    category: "ad",
    platforms: ["facebook", "instagram"],
    description:
      "Paid social ad copy for Meta platforms. Multiple variants for A/B testing.",
    structure:
      "Primary text (125 chars ideal):\n  Variant A: Problem-agitate-solve\n  Variant B: Benefit-led\n  Variant C: Social proof\n\nHeadline (40 chars): Key benefit\nDescription (30 chars): Supporting detail\nCTA button: Learn More / Shop Now / Sign Up\n\nCreative notes: Image/video specs",
  },
  {
    name: "Google Search Ad",
    category: "ad",
    description:
      "Responsive search ad with multiple headlines and descriptions.",
    structure:
      "Headlines (30 chars each, provide 10-15):\n  - Include keyword variations\n  - Benefit statements\n  - CTAs\n  - Brand name variants\n\nDescriptions (90 chars each, provide 4):\n  - Feature + benefit\n  - Social proof\n  - Urgency / offer\n  - Brand differentiator\n\nFinal URL + display path",
  },
  {
    name: "LinkedIn Sponsored Post",
    category: "ad",
    platforms: ["linkedin"],
    description:
      "B2B targeted ad for LinkedIn feed. Professional tone.",
    structure:
      "Intro text (150 chars):\n  Hook with business challenge\n\nBody (600 chars max):\n  - Problem statement\n  - How you solve it\n  - Key metric or result\n\nCTA: Download whitepaper / Request demo / Learn more\n\nCreative: Professional image or short video",
  },
  {
    name: "YouTube Pre-Roll Ad",
    category: "ad",
    platforms: ["youtube"],
    description:
      "5-15 second skippable video ad script.",
    structure:
      "First 5 seconds (before skip):\n  - Brand mention + core message\n  - Visual hook\n\nFull 15 seconds:\n  - Problem (2s)\n  - Solution (5s)\n  - Proof point (3s)\n  - CTA + URL (5s)\n\nCompanion banner specs",
  },
];

export function getDefaultTemplatesWithIds(): Template[] {
  const now = new Date().toISOString();
  return DEFAULTS.map((d) => ({
    id: nanoid(),
    name: d.name,
    category: d.category,
    platforms: d.platforms as Template["platforms"],
    data: {
      description: d.description,
      structure: d.structure,
    },
    createdAt: now,
    updatedAt: now,
  }));
}
