/**
 * Seed Z1 Forge brand vault with real content from z1.sbv.one.
 * Usage: bun run db/seed-brand-vault.ts
 */

import { createDb } from "./index";
import { brandKits } from "./schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const db = createDb(DATABASE_URL);
const now = new Date().toISOString();

// ─── Section content ────────────────────────────────────────────

const BRAND_VOICE = `# Z1 Forge — Brand Voice Document

## Voice Personality
Z1 Forge speaks like a **senior builder** who's been in the trenches — direct, energetic, and relentlessly execution-focused. We don't lecture. We challenge. We don't promise outcomes. We build them.

## Voice Attributes

### 1. Direct & Action-Oriented
We cut through the noise. Every sentence should feel like it's pushing someone closer to shipping.
- **Do:** "Ship every Friday. No exceptions."
- **Don't:** "We encourage our participants to try to ship on a weekly cadence."

### 2. Confident, Not Arrogant
We know our program works because we've seen the results. But we lead with evidence, not ego.
- **Do:** "50+ signups and 10+ active users by Week 9."
- **Don't:** "We're the best accelerator in Southeast Asia."

### 3. Builder-to-Builder
We speak as peers. Our audience isn't "students" or "applicants" — they're builders, hackers, hustlers.
- **Do:** "You've got the idea. We've got the forge."
- **Don't:** "Apply to our prestigious program today."

### 4. Urgency Without Pressure
We create urgency through the reality of shipping deadlines, not through artificial scarcity.
- **Do:** "12 weeks. Live product. Real users. That's the deal."
- **Don't:** "Only 5 spots remaining! Apply NOW before it's too late!!!"

## Tone Modifiers by Channel

| Channel | Tone Shift |
|---------|-----------|
| Website | Confident, aspirational, structured |
| X | Punchy, provocative, meme-friendly |
| LinkedIn | Professional but still direct, results-focused |
| Instagram | Visual-first, behind-the-scenes energy |
| TikTok | Raw, fast-paced, builder culture |
| Email | Personal, conversational, deadline-aware |

## Key Phrases & Vocabulary
- "Ship it" / "Ship every Friday"
- "From idea to live product"
- "The collaborative forge"
- "Stop planning, start shipping"
- "Builders, not dreamers"
- "Deployments over decks"
- "The world has enough pitch decks"
- "Zero to One" (existence over perfection)

## Words We Use vs. Words We Avoid

| Use | Avoid |
|-----|-------|
| Build, ship, launch | Ideate, conceptualize, synergize |
| Builders, makers, hackers | Students, applicants, participants |
| Forge, sprint, deploy | Program, course, curriculum |
| Real users, live product | Theoretical, hypothetical |
| Team, squad | Cohort members |
`;

const MESSAGING_FRAMEWORK = `# Z1 Forge — Messaging Framework

## Brand Positioning Statement
For aspiring product builders in the Philippines and beyond, Z1 Forge is the 12-week intensive program that transforms ideas into live, revenue-capable products — because the best way to learn is to ship.

## Core Brand Promise
**"Ship a Live Product in 12 Weeks."**

## Tagline
"The collaborative forge where small teams build, ship, and launch real products with real users — in just 12 weeks."

## Value Propositions

### 1. Speed Through Structure
> Every team ships every Friday. A structured 12-week journey from landing page to Demo Day, with weekly milestones that eliminate procrastination.

### 2. Teams, Not Individuals
> The 4H Framework (Hacker, Hustler, Hipster, Hound) ensures every product has technical execution, growth strategy, brand design, and user research built in.

### 3. AI-Augmented, Human-Owned
> AI handles scaffolding, pair programming, copy drafts, and research synthesis. Humans own architecture, design direction, messaging voice, and final approvals.

### 4. Real Users, Real Feedback
> By Week 9, every product has 50+ signups and 10+ active users. No theoretical validation — real people using real software.

### 5. Network Beyond the Program
> Access to the SBV ecosystem: Mentor platform, InSpace community, Pitch events, Grit Chronicles, and Breakpoints.live.

## Messaging by Audience

### For Technical Founders (Hackers)
"Stop building side projects alone. Join a team, ship every Friday, and launch with real users by Week 9."

### For Business-Minded Founders (Hustlers)
"Your MBA didn't teach you to ship software. 12 weeks, a real product, real revenue. That's the forge."

### For Designers & Creatives (Hipsters)
"Design isn't a mockup in Figma. It's a live product people use. Build your portfolio with shipped products."

### For Researchers & Analysts (Hounds)
"Turn insights into products. Join a team where your research directly shapes what gets built and shipped."

## Elevator Pitch (30 seconds)
"Z1 Forge is a 12-week bootcamp where teams of four build and launch live products. Every team ships every Friday. By graduation, you have a deployed product with real users, investor-ready pitch deck, and a 90-day roadmap. We're not an incubator — we're a forge."

## Competitive Differentiation
- **vs. Traditional Accelerators:** We build products, not pitch decks.
- **vs. Bootcamps:** We ship real products with real users, not class projects.
- **vs. Going Solo:** The 4H team model means you never build alone.
- **vs. Online Courses:** Deadlines, teams, and Demo Day keep you accountable.
`;

const STYLE_GUIDE = `# Z1 Forge — Style Guide & Copy Rules

## Writing Principles

### 1. Lead with Action
Every headline, CTA, and opening sentence should start with a verb or imply motion.
- Good: "Ship your first product in 12 weeks."
- Bad: "Our program is a 12-week experience."

### 2. Short Sentences Win
Maximum 20 words per sentence in marketing copy. Break complex ideas into punchy fragments when appropriate.
- Good: "12 weeks. Live product. Real users. That's the deal."
- Bad: "Over the course of 12 weeks, our program helps you build a product that reaches real users."

### 3. Numbers > Adjectives
Quantify everything. Replace vague claims with specific metrics.
- Good: "50+ signups by Week 9"
- Bad: "Impressive user traction"

### 4. No Corporate Speak
If it sounds like it belongs in a press release, rewrite it.
- Good: "We build. We ship. We launch."
- Bad: "Z1 Forge leverages a proprietary framework to accelerate innovation."

## Formatting Rules

### Headlines
- Title Case for H1 headers
- Sentence case for H2 and below
- Max 8 words for hero headlines
- Max 12 words for section headlines

### Body Copy
- 14-16px base font size on web
- 1.6 line height for readability
- Max 65 characters per line
- Paragraph breaks every 2-3 sentences

### CTAs
- Always action verbs: "Apply Now", "Start Building", "Join the Forge"
- Never passive: avoid "Learn More", "Click Here", "Submit"
- Primary CTA: "Apply for Cohort 1"
- Secondary CTA: "Take the Builder Quiz"

## Capitalization & Terms
- **Z1 Forge** (not "Z-One Forge" or "z1 forge" in running text)
- **4H Framework** (always capitalized, always with "Framework")
- **Hacker, Hustler, Hipster, Hound** (capitalized when referring to roles)
- **Demo Day** (capitalized, two words)
- **Ship Friday** (our internal shorthand, always capitalized)
- **SBV** or **Starting Block Ventures** (never "SBV Ventures")

## Hashtag Strategy
Primary: #Z1Forge #ShipItFriday #BuildInPublic
Secondary: #StartupPH #TechPH #IndieHackers #4HFramework
Event: #GritChronicles #BreakpointsLive #InSpacePitch #DemoDay
`;

const VISUAL_IDENTITY = `# Z1 Forge — Visual Identity Specs

## Color Palette

### Primary Colors
- **Forge Orange:** #f97316 — Primary brand color, CTAs, highlights
- **Deep Black:** #0a0a0c — Text, backgrounds in dark mode
- **Pure White:** #ffffff — Backgrounds in light mode, reverse text

### Secondary Colors
- **Steel Gray:** #71717a — Muted text, secondary elements
- **Zinc 100:** #f4f4f5 — Light backgrounds, cards in light mode
- **Zinc 900:** #18181b — Cards, elevated surfaces in dark mode

### Accent Colors
- **Hacker Blue:** #3b82f6 — Technical content, code references
- **Hustler Green:** #22c55e — Growth metrics, success states
- **Hipster Purple:** #a855f7 — Design, creative content
- **Hound Amber:** #f59e0b — Research, data, analytics

### Status Colors
- **Success:** #22c55e
- **Warning:** #f59e0b
- **Error:** #ef4444
- **Info:** #3b82f6

## Typography

### Font Stack
- **Headings:** Manrope (700 Bold, 600 Semibold)
- **Body:** DM Sans (400 Regular, 500 Medium)
- **Code/Mono:** Geist Mono (400 Regular)
- **Fallback:** system-ui, -apple-system, "Segoe UI", Roboto, sans-serif

### Type Scale
- Hero: 48px / 1.1 line-height / Manrope Bold
- H1: 32px / 1.2 / Manrope Bold
- H2: 24px / 1.3 / Manrope Semibold
- H3: 20px / 1.4 / Manrope Semibold
- Body: 16px / 1.6 / DM Sans Regular
- Small: 14px / 1.5 / DM Sans Regular
- Caption: 12px / 1.4 / DM Sans Medium
- Mono: 14px / 1.5 / Geist Mono

## Logo Usage
- Minimum clear space: 1x logo height on all sides
- Minimum size: 32px height for digital
- Dark background: White/orange logo
- Light background: Black/orange logo
- Never stretch, rotate, or add effects to the logo

## Spacing System
Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

## Border Radius
- Buttons: 4px (sharp, intentional)
- Cards: 6px
- Modals: 8px
- Avatars: 50% (full circle)

## Imagery Style
- High-contrast photography with spotlight/stage lighting
- Builder-at-work shots (hands on keyboards, whiteboards, screens)
- Team collaboration moments
- Dark backgrounds with orange accent lighting
- Avoid: stock photos, generic office shots, handshakes
`;

function makeItem(title: string, content: string, metadata?: Record<string, string>) {
  return {
    id: nanoid(),
    title,
    content,
    metadata,
    createdAt: now,
    updatedAt: now,
  };
}

const TARGET_AUDIENCES = [
  makeItem(
    "Technical Founders (Hackers)",
    `**Demographics:** 22-35, software engineers, CS graduates, self-taught developers
**Location:** Philippines, Southeast Asia, global remote
**Pain Points:** Building side projects alone that never launch; lack of accountability; no team to cover non-technical gaps
**Goals:** Ship a real product, find co-founders, build a portfolio of launched products
**Channels:** X, GitHub, Dev.to, Reddit r/SideProject, Hacker News
**Messaging Hook:** "Stop building side projects alone. Join a team, ship every Friday, and launch with real users by Week 9."`,
    { segment: "primary", role: "Hacker" }
  ),
  makeItem(
    "Business-Minded Founders (Hustlers)",
    `**Demographics:** 25-40, MBA graduates, sales professionals, aspiring entrepreneurs
**Location:** Philippines, ASEAN markets
**Pain Points:** Have business ideas but can't code; tired of paying agencies; want to understand product development
**Goals:** Launch a revenue-generating product, validate a business model, build a founding team
**Channels:** LinkedIn, Facebook Groups, Startup events, podcasts
**Messaging Hook:** "Your MBA didn't teach you to ship software. 12 weeks, a real product, real revenue."`,
    { segment: "primary", role: "Hustler" }
  ),
  makeItem(
    "Designers & Creatives (Hipsters)",
    `**Demographics:** 22-32, UI/UX designers, graphic designers, brand strategists
**Location:** Philippines, remote creatives globally
**Pain Points:** Portfolio full of concepts but no shipped products; want to move from agency work to product ownership
**Goals:** Ship a product they designed end-to-end, build a brand from scratch, transition to product roles
**Channels:** Instagram, Dribbble, Behance, X, design communities
**Messaging Hook:** "Design isn't a mockup in Figma. It's a live product people use."`,
    { segment: "primary", role: "Hipster" }
  ),
  makeItem(
    "Researchers & Analysts (Hounds)",
    `**Demographics:** 24-35, data analysts, UX researchers, market researchers, product managers
**Location:** Philippines, data-driven professionals globally
**Pain Points:** Insights never get implemented; research sits in slide decks; want to see data drive real products
**Goals:** Translate research into shipped features, build data-driven products, validate hypotheses with real users
**Channels:** LinkedIn, Medium, research communities, analytics forums
**Messaging Hook:** "Turn insights into products. Your research shapes what gets built and shipped."`,
    { segment: "secondary", role: "Hound" }
  ),
  makeItem(
    "Career Switchers",
    `**Demographics:** 28-42, professionals from non-tech industries looking to break into tech/startups
**Location:** Philippines, ASEAN
**Pain Points:** Don't know where to start; overwhelmed by online courses; need structured accountability
**Goals:** Build their first tech product, understand startup mechanics, network with builders
**Channels:** Facebook, LinkedIn, career transition communities, startup meetups
**Messaging Hook:** "Built for anyone ready to stop planning and start shipping. All niches welcome."`,
    { segment: "secondary", role: "Any" }
  ),
];

const CONTENT_EXAMPLES = [
  makeItem(
    "Hero CTA — Website",
    `**Copy:** "Ship a Live Product in 12 Weeks"
**Subhead:** "The collaborative forge where small teams build, ship, and launch real products with real users — in just 12 weeks."
**CTA Button:** "Apply for Cohort 1"

**Why it works:** Leads with the core promise (live product), includes a specific timeframe (12 weeks), and the CTA is action-oriented with urgency (Cohort 1 implies limited batches).`,
    { platform: "website", type: "hero" }
  ),
  makeItem(
    "X Thread — Ship Friday",
    `**Tweet 1:** "Every team at Z1 Forge ships every Friday. No exceptions. Here's what Week 4 looked like: 🧵"

**Tweet 2:** "Monday: Sprint kickoff. The Hacker scoped the auth system. The Hustler mapped the onboarding funnel. The Hipster started the brand kit. The Hound ran 5 user interviews."

**Tweet 3:** "Friday: Auth + social login deployed. Onboarding flow live. Brand guide v1 done. 3 users signed up through the landing page. That's Week 4."

**Tweet 4:** "Most programs teach you to build a pitch deck by Week 4. We had a live product with real users. That's the difference. Apply: z1.sbv.one"

**Why it works:** Concrete, specific, shows the 4H framework in action. Ends with contrast positioning and CTA.`,
    { platform: "x", type: "thread" }
  ),
  makeItem(
    "LinkedIn Post — Program Results",
    `**Post:** "The world has enough pitch decks.

At Z1 Forge, we don't grade presentations. We count deployments.

By Week 9, every team has:
→ A production-deployed product
→ 50+ real signups
→ 10+ active users
→ 2+ third-party integrations

By Week 12:
→ Revenue or validated pricing
→ Investor-ready pitch deck
→ 90-day technical roadmap

We're opening applications for Cohort 1. If you're tired of planning and ready to ship — link in comments.

#Z1Forge #ShipItFriday #StartupPH #BuildInPublic"

**Why it works:** Opens with a provocative statement, uses concrete metrics, clear structure, professional but direct tone. CTA drives to comments for engagement.`,
    { platform: "linkedin", type: "post" }
  ),
  makeItem(
    "Instagram Carousel — 4H Framework",
    `**Slide 1 (Cover):** "Every great product needs 4 roles. Here's why."
**Slide 2:** "🔧 HACKER — Owns the code. Architecture, APIs, deployment. The builder."
**Slide 3:** "📈 HUSTLER — Owns growth. User acquisition, sales, go-to-market. The closer."
**Slide 4:** "🎨 HIPSTER — Owns the brand. Design, UX, visual identity. The storyteller."
**Slide 5:** "🔍 HOUND — Owns the data. User research, analytics, insights. The compass."
**Slide 6:** "Together, they form a complete product team. No gaps. No excuses."
**Slide 7 (CTA):** "Find your role. Apply at z1.sbv.one"

**Caption:** "Solo founders burn out. Teams ship products. The 4H Framework ensures every angle is covered — tech, growth, design, and research. Which H are you? 👇 #Z1Forge #4HFramework"

**Why it works:** Educational, shareable, ends with engagement prompt. Each slide is scannable.`,
    { platform: "instagram", type: "carousel" }
  ),
  makeItem(
    "Email — Application Open",
    `**Subject:** "12 weeks. 1 live product. Are you in?"
**Preview text:** "Applications for Z1 Forge Cohort 1 are now open."

**Body:**
Hey [Name],

We're opening the forge.

Z1 Forge is a 12-week intensive where teams of four build and launch real products. Not wireframes. Not pitch decks. Live, deployed software with real users.

Here's what you'll walk away with:
• A production-ready product with 50+ signups
• An investor-ready pitch deck
• A 90-day roadmap
• A team that actually ships

We're looking for Hackers, Hustlers, Hipsters, and Hounds.

→ Apply now: z1.sbv.one/apply

Spots are limited for Cohort 1. If you've been sitting on an idea, this is your sign to start building.

Let's ship.
— The Z1 Forge Team

**Why it works:** Short, punchy, personal tone. Bullet points for scannability. Clear CTA with urgency.`,
    { platform: "email", type: "announcement" }
  ),
];

const ANTI_EXAMPLES = [
  makeItem(
    "Corporate Jargon",
    `**Bad Copy:** "Z1 Forge leverages a proprietary synergistic framework to accelerate innovation ecosystems and drive transformative outcomes for emerging entrepreneurs."

**Why it's wrong:**
- Uses corporate buzzwords (leverage, synergistic, transformative, ecosystems)
- Passive and vague — says nothing specific
- Sounds like every other accelerator's generic pitch
- Zero personality or brand voice

**Fix:** "We build products. Not decks. 12 weeks, 4 teammates, 1 live product."`,
    { type: "tone-violation" }
  ),
  makeItem(
    "Fear-Based Urgency",
    `**Bad Copy:** "🚨 ONLY 3 SPOTS LEFT!!! Apply NOW before it's TOO LATE!!! Don't miss this ONCE-IN-A-LIFETIME opportunity!! 🚨🔥💥"

**Why it's wrong:**
- Fake scarcity / manipulation tactics
- Excessive punctuation and emojis
- Screams desperation, not confidence
- Undermines trust and brand credibility

**Fix:** "Cohort 1 applications close March 31. Teams are forming now. Apply at z1.sbv.one"`,
    { type: "tone-violation" }
  ),
  makeItem(
    "Passive / Wishy-Washy Language",
    `**Bad Copy:** "We kind of help people who might be interested in potentially building some sort of tech product, if that's something they think they could maybe try doing."

**Why it's wrong:**
- Hedging words everywhere (kind of, might, potentially, maybe)
- Zero confidence — why would anyone trust this program?
- Our brand is direct and decisive

**Fix:** "You build. We forge. 12 weeks to a live product."`,
    { type: "tone-violation" }
  ),
  makeItem(
    "Generic Stock Photo Social Post",
    `**Bad Post:** [Stock photo of people in suits shaking hands]
"Excited to announce our new partnership! We're thrilled to be working together to create value for our stakeholders. #Innovation #Synergy #Excited"

**Why it's wrong:**
- Stock photo screams "we have nothing real to show"
- Generic caption with zero specifics
- Hashtags are meaningless corporate tags
- "Thrilled" and "excited" are empty words

**Fix:** Use real photos of builders at work. Caption should state what was built, shipped, or launched with specific outcomes.`,
    { type: "visual-violation" }
  ),
  makeItem(
    "Over-Explaining the Program",
    `**Bad Copy:** "Z1 Forge is a comprehensive 12-week program that was founded in 2024 by Starting Block Ventures as part of their ecosystem strategy to help aspiring entrepreneurs in the Philippines develop their ideas into minimum viable products through a structured curriculum that includes weekly sprints, mentor sessions, and a final Demo Day presentation where teams showcase their work to a panel of investors and industry experts."

**Why it's wrong:**
- One sentence trying to say everything
- Buries the lead (live product) under background info
- No one reads 60-word sentences in marketing
- Reads like a Wikipedia article, not a brand

**Fix:** "12 weeks. Team of 4. Live product with real users. That's Z1 Forge." Then link to /about for the full story.`,
    { type: "structure-violation" }
  ),
];

const PRODUCTS = [
  makeItem(
    "Z1 Forge — 12-Week Bootcamp",
    `**Type:** Flagship program
**Price:** TBD (Cohort 1 pricing)
**Duration:** 12 weeks
**Format:** Team-based, intensive, weekly shipping cadence

**Description:**
The core Z1 Forge experience. Teams of four (Hacker, Hustler, Hipster, Hound) build and launch a live product in 12 weeks. Includes weekly sprints, mentor access, mid-program InSpace Pitch (Week 6), and Demo Day (Week 12).

**Deliverables:**
- Production-deployed application
- 50+ real user signups, 10+ active users
- 2+ third-party integrations
- Payment/billing system
- Investor-ready pitch deck
- 90-day technical roadmap
- Brand identity package

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Neon/Supabase, Vercel

**Weekly Rhythm:**
- Monday: Sprint Kickoff
- Tue-Thu: Build/Ship/Collaborate
- Wednesday: Mid-week Team Challenge
- Friday: Feedback Friday (ship day)
- Saturday: Weekly Retrospective`,
    { type: "program", status: "active" }
  ),
  makeItem(
    "4H Framework — Team Model",
    `**Type:** Methodology / IP
**Audience:** All Z1 Forge teams

**Description:**
The 4H Framework is Z1 Forge's proprietary team structure ensuring every product has complete coverage across four critical domains.

**The 4 Roles:**
1. **Hacker** — Code owner. Architecture, APIs, deployment, technical decisions.
2. **Hustler** — Growth owner. User acquisition, sales, go-to-market, revenue.
3. **Hipster** — Brand owner. Design, UX, visual identity, content creation.
4. **Hound** — Data owner. User research, analytics, insights, validation.

**6 Collaboration Pairs:**
- Hacker × Hipster → Product Pair (UI/UX ownership)
- Hacker × Hound → Quality Pair (testing & bugs)
- Hacker × Hustler → Ship Pair (deployment & distribution)
- Hustler × Hipster → Growth Pair (brand & business narrative)
- Hustler × Hound → Strategy Pair (data-driven positioning)
- Hipster × Hound → Empathy Pair (user-resonant content)`,
    { type: "methodology", status: "active" }
  ),
  makeItem(
    "SBV Ecosystem Platforms",
    `**Type:** Platform suite
**Operator:** Starting Block Ventures

**Platforms:**
1. **Z1 Forge** (z1.sbv.one) — 12-week bootcamp for product builders
2. **Mentor** (mentor.sbv.one) — Mentor matching and advisory platform
3. **Pitch** (pitch.sbv.one) — Pitch event management and investor connections
4. **InSpace** (sbv.one/inspace) — Community hub for builders and founders

**Community Events:**
- **Grit Chronicles** — Monthly founder fireside chats
- **Breakpoints.live** — Livestreamed challenges and community moments
- **InSpace Pitch** — Mid-program (Week 6) and Demo Day (Week 12) presentations

**Partners:** DOGM AI, Bull Run Consulting, Breakpoints.live, Incub8space`,
    { type: "ecosystem", status: "active" }
  ),
  makeItem(
    "Builder Quiz",
    `**Type:** Lead generation tool
**URL:** z1.sbv.one/quiz
**Purpose:** Help prospective applicants identify their 4H role before applying

**Description:**
An interactive quiz that matches builders to their primary 4H role (Hacker, Hustler, Hipster, or Hound) based on their skills, interests, and working style. Serves as a top-of-funnel conversion tool.

**Conversion Flow:**
1. User takes quiz (z1.sbv.one/quiz)
2. Gets matched to a role with description
3. CTA: "Apply as a [Role] for Cohort 1"
4. Links to application form

**Content Hook:** "Which H are you?" — used across social media to drive quiz traffic.`,
    { type: "tool", status: "active" }
  ),
];

// ─── Main ───────────────────────────────────────────────────────

async function run() {
  // Get the Z1 Forge brand
  const rows = await db.select().from(brandKits).limit(1);
  if (rows.length === 0) {
    console.error("No brands found. Create a brand first.");
    process.exit(1);
  }

  const brand = rows[0].data as Record<string, unknown>;
  const brandId = rows[0].id;
  const sections = (brand.sections ?? []) as Array<Record<string, unknown>>;

  // Update each section
  for (const section of sections) {
    switch (section.id) {
      case "brand-voice":
        section.content = BRAND_VOICE;
        section.updatedAt = now;
        break;
      case "messaging-framework":
        section.content = MESSAGING_FRAMEWORK;
        section.updatedAt = now;
        break;
      case "style-guide":
        section.content = STYLE_GUIDE;
        section.updatedAt = now;
        break;
      case "visual-identity":
        section.content = VISUAL_IDENTITY;
        section.updatedAt = now;
        break;
      case "target-audiences":
        section.items = TARGET_AUDIENCES;
        section.updatedAt = now;
        break;
      case "content-examples":
        section.items = CONTENT_EXAMPLES;
        section.updatedAt = now;
        break;
      case "anti-examples":
        section.items = ANTI_EXAMPLES;
        section.updatedAt = now;
        break;
      case "products":
        section.items = PRODUCTS;
        section.updatedAt = now;
        break;
    }
  }

  brand.sections = sections;
  brand.updatedAt = now;

  // Save back
  await db
    .update(brandKits)
    .set({
      data: brand,
      updatedAt: new Date(),
    })
    .where(eq(brandKits.id, brandId));

  console.log(`Seeded brand vault for "${rows[0].name}" (${brandId})`);
  console.log("  - Brand Voice Document: ✓");
  console.log("  - Messaging Framework: ✓");
  console.log("  - Style Guide / Copy Rules: ✓");
  console.log("  - Visual Identity Specs: ✓");
  console.log(`  - Target Audience Profiles: ${TARGET_AUDIENCES.length} items`);
  console.log(`  - Content Examples: ${CONTENT_EXAMPLES.length} items`);
  console.log(`  - Anti-Examples: ${ANTI_EXAMPLES.length} items`);
  console.log(`  - Product/Service Descriptions: ${PRODUCTS.length} items`);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
