/**
 * Brand Brain MCP Server
 *
 * Exposes the brand memory system (Neon pgvector) as MCP tools
 * so Claude CLI can actively search, learn, and recall brand knowledge
 * during content generation.
 *
 * Usage: bun run scripts/brand-brain-mcp.ts
 * Configured in: .claude/mcp.json
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { cosineDistance, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb } from "../db/index";
import {
  brandKits,
  brandMemories,
  campaigns,
  frames,
  socialCopies,
  platformSpecs,
} from "../db/schema";

// ─── Environment ────────────────────────────────────────────────

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

const db = createDb(DATABASE_URL);

// ─── Embedding helper ───────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 512,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI Embedding API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  return json.data[0].embedding;
}

// ─── MCP Server ─────────────────────────────────────────────────

const server = new McpServer({
  name: "brand-brain",
  version: "1.0.0",
});

// ─── Tool 1: recall ─────────────────────────────────────────────

server.tool(
  "recall",
  "Search brand memories using semantic similarity. Returns past learnings, preferences, rejections, and approved patterns relevant to a query.",
  {
    brandId: z.string().describe("The brand ID to search memories for"),
    query: z
      .string()
      .describe(
        "Natural language query to find relevant memories (e.g. 'Instagram tone preferences', 'what was rejected before')"
      ),
    topK: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Max number of results to return"),
    type: z
      .enum([
        "preference",
        "rejection",
        "approval",
        "feedback",
        "learned_style",
      ])
      .optional()
      .describe("Filter by memory type"),
    minSimilarity: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.3)
      .describe("Minimum cosine similarity threshold"),
  },
  async ({ brandId, query, topK, type, minSimilarity }) => {
    try {
      const embedding = await generateEmbedding(query);
      const similarity = sql<number>`1 - (${cosineDistance(brandMemories.embedding, embedding)})`;

      const conditions = [
        eq(brandMemories.brandId, brandId),
        eq(brandMemories.isActive, true),
      ];
      if (type) {
        conditions.push(eq(brandMemories.type, type));
      }

      const rows = await db
        .select({
          id: brandMemories.id,
          type: brandMemories.type,
          source: brandMemories.source,
          title: brandMemories.title,
          content: brandMemories.content,
          tags: brandMemories.tags,
          importance: brandMemories.importance,
          similarity,
        })
        .from(brandMemories)
        .where(and(...conditions))
        .orderBy(sql`${similarity} DESC`)
        .limit(topK ?? 5);

      const filtered = rows.filter(
        (r) => (r.similarity ?? 0) >= (minSimilarity ?? 0.3)
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                memories: filtered,
                count: filtered.length,
                query,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error searching memories: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 2: remember ──────────────────────────────────────────

server.tool(
  "remember",
  "Store a new brand memory — a learning, preference, rejection pattern, or style observation. The memory will be embedded for future semantic search.",
  {
    brandId: z.string().describe("The brand ID this memory belongs to"),
    type: z
      .enum([
        "preference",
        "rejection",
        "approval",
        "feedback",
        "learned_style",
      ])
      .describe("Type of memory"),
    title: z
      .string()
      .describe("Short title for the memory (what was learned)"),
    content: z
      .string()
      .describe("Detailed description of the learning or preference"),
    tags: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Searchable tags"),
    importance: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .default(3)
      .describe("Importance: 1=low, 3=default, 5=critical"),
    source: z
      .enum(["manual", "auto_rejection", "auto_approval", "import"])
      .optional()
      .default("manual")
      .describe("How this memory was created"),
  },
  async ({ brandId, type, title, content, tags, importance, source }) => {
    try {
      const id = nanoid(8);
      const now = new Date();
      const embedding = await generateEmbedding(`${title}\n${content}`);

      await db.insert(brandMemories).values({
        id,
        brandId,
        type,
        source: source ?? "manual",
        title,
        content,
        tags: tags ?? [],
        importance: importance ?? 3,
        embedding,
        data: {},
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              memoryId: id,
              message: `Stored "${title}" as ${type} memory`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error storing memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 3: get_brand_context ──────────────────────────────────

server.tool(
  "get_brand_context",
  "Get the full brand vault — identity, voice, style guide, messaging, target audiences, content examples, and anti-examples. Call this before generating any content.",
  {
    brandId: z.string().describe("The brand ID to get context for"),
  },
  async ({ brandId }) => {
    try {
      const rows = await db
        .select()
        .from(brandKits)
        .where(eq(brandKits.id, brandId));

      if (rows.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Brand not found: ${brandId}`,
            },
          ],
          isError: true,
        };
      }

      const brand = rows[0];
      const data = brand.data as {
        sections?: Array<{
          id: string;
          label: string;
          kind: string;
          content?: string;
          items?: Array<{
            title: string;
            content: string;
            metadata?: Record<string, unknown>;
          }>;
        }>;
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                brand: {
                  id: brand.id,
                  name: brand.name,
                  description: brand.description,
                  sections: data.sections ?? [],
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching brand: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 4: get_campaign ───────────────────────────────────────

server.tool(
  "get_campaign",
  "Get campaign details including objectives, target platforms, and content pillars. Use this to align generated content with campaign goals.",
  {
    campaignId: z
      .string()
      .optional()
      .describe("Specific campaign ID to fetch"),
    brandId: z
      .string()
      .optional()
      .describe("Get all campaigns for this brand"),
    status: z
      .enum(["draft", "active", "paused", "completed", "archived"])
      .optional()
      .describe("Filter by campaign status"),
  },
  async ({ campaignId, brandId, status }) => {
    try {
      if (!campaignId && !brandId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Provide either campaignId or brandId",
            },
          ],
          isError: true,
        };
      }

      const conditions = [];
      if (campaignId) conditions.push(eq(campaigns.id, campaignId));
      if (brandId) conditions.push(eq(campaigns.brandId, brandId));
      if (status) conditions.push(eq(campaigns.status, status));

      const rows = await db
        .select()
        .from(campaigns)
        .where(and(...conditions))
        .orderBy(desc(campaigns.createdAt));

      const result = rows.map((r) => ({
        id: r.id,
        brandId: r.brandId,
        name: r.name,
        description: r.description,
        status: r.status,
        objective: r.objective,
        startDate: r.startDate,
        endDate: r.endDate,
        platforms: r.platforms,
        contentPillars: r.contentPillars,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ campaigns: result }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching campaigns: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 5: get_approved_content ───────────────────────────────

server.tool(
  "get_approved_content",
  "Get past approved content (frames and social copies) for a brand. Use this to learn from what worked before and match quality/style.",
  {
    brandId: z.string().describe("The brand ID"),
    contentType: z
      .enum([
        "social-post",
        "email",
        "blog-article",
        "ad-copy",
        "landing-page",
        "video-script",
        "custom",
      ])
      .optional()
      .describe("Filter by content type"),
    platform: z
      .enum([
        "instagram",
        "x",
        "linkedin",
        "facebook",
        "tiktok",
        "youtube",
        "newsletter",
        "website",
        "other",
      ])
      .optional()
      .describe("Filter by platform"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Max results to return"),
  },
  async ({ brandId, contentType, platform, limit }) => {
    try {
      // Query approved frames
      const frameConditions = [
        eq(frames.brandId, brandId),
        eq(frames.status, "approved"),
      ];
      if (contentType) frameConditions.push(eq(frames.contentType, contentType));
      if (platform) frameConditions.push(eq(frames.platform, platform));

      const approvedFrames = await db
        .select({
          id: frames.id,
          title: frames.title,
          contentType: frames.contentType,
          platform: frames.platform,
          data: frames.data,
          updatedAt: frames.updatedAt,
        })
        .from(frames)
        .where(and(...frameConditions))
        .orderBy(desc(frames.updatedAt))
        .limit(limit ?? 5);

      // Query approved social copies
      const copyConditions = [
        eq(socialCopies.brandId, brandId),
        eq(socialCopies.status, "approved"),
      ];
      if (platform) copyConditions.push(eq(socialCopies.platform, platform));

      const approvedCopies = await db
        .select({
          id: socialCopies.id,
          platform: socialCopies.platform,
          caption: socialCopies.caption,
          hashtags: socialCopies.hashtags,
          cta: socialCopies.cta,
          updatedAt: socialCopies.updatedAt,
        })
        .from(socialCopies)
        .where(and(...copyConditions))
        .orderBy(desc(socialCopies.updatedAt))
        .limit(limit ?? 5);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                approvedFrames: approvedFrames.map((f) => ({
                  id: f.id,
                  title: f.title,
                  contentType: f.contentType,
                  platform: f.platform,
                  generatedContent: (f.data as Record<string, unknown>)
                    ?.generatedContent,
                  brief: (f.data as Record<string, unknown>)?.brief,
                })),
                approvedCopies: approvedCopies.map((c) => ({
                  id: c.id,
                  platform: c.platform,
                  caption: c.caption,
                  hashtags: c.hashtags,
                  cta: c.cta,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching approved content: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 6: get_platform_specs ─────────────────────────────────

server.tool(
  "get_platform_specs",
  "Get platform-specific constraints: dimensions, character limits, hashtag limits, supported formats, and content rules.",
  {
    platform: z
      .enum([
        "instagram",
        "x",
        "linkedin",
        "facebook",
        "tiktok",
        "youtube",
        "newsletter",
        "website",
        "other",
      ])
      .describe("The platform to get specs for"),
    format: z
      .string()
      .optional()
      .describe("Specific format (e.g. 'story', 'reel', 'post', 'carousel')"),
  },
  async ({ platform, format }) => {
    try {
      const conditions = [eq(platformSpecs.platform, platform)];
      if (format) conditions.push(eq(platformSpecs.format, format));

      const rows = await db
        .select()
        .from(platformSpecs)
        .where(and(...conditions));

      const specs = rows.map((r) => ({
        platform: r.platform,
        format: r.format,
        name: r.name,
        width: r.width,
        height: r.height,
        aspectRatio: r.aspectRatio,
        maxFileSize: r.maxFileSize,
        maxDuration: r.maxDuration,
        captionLimit: r.captionLimit,
        hashtagLimit: r.hashtagLimit,
        supportedFormats: r.supportedFormats,
        rules: r.rules,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ specs }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching platform specs: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 7: log_feedback ───────────────────────────────────────

server.tool(
  "log_feedback",
  "Record when content is approved or rejected. Creates a brand memory so future generations learn from this feedback.",
  {
    brandId: z.string().describe("The brand ID"),
    contentDescription: z
      .string()
      .describe(
        "Brief description of what was generated (e.g. 'Instagram carousel about spring gardening tips')"
      ),
    verdict: z
      .enum(["approved", "rejected"])
      .describe("Whether the content was approved or rejected"),
    reason: z
      .string()
      .optional()
      .describe("Why it was approved/rejected — the more detail the better"),
    tags: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Relevant tags for searchability"),
  },
  async ({ brandId, contentDescription, verdict, reason, tags }) => {
    try {
      const id = nanoid(8);
      const now = new Date();
      const memoryType = verdict === "approved" ? "approval" : "rejection";
      const source =
        verdict === "approved" ? "auto_approval" : "auto_rejection";
      const title = `${verdict === "approved" ? "Approved" : "Rejected"}: ${contentDescription}`;
      const content = reason
        ? `${contentDescription}\n\nReason: ${reason}`
        : contentDescription;

      const embedding = await generateEmbedding(`${title}\n${content}`);

      await db.insert(brandMemories).values({
        id,
        brandId,
        type: memoryType,
        source,
        title,
        content,
        tags: [...(tags ?? []), "feedback", verdict],
        importance: 3,
        embedding,
        data: { verdict },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              memoryId: id,
              message: `Logged ${verdict} feedback as ${memoryType} memory`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error logging feedback: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Start server ───────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
