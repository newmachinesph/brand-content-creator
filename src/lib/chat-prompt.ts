import type { ChatMessage } from "@/types/chat";
import type { BrandSection } from "@/types/brand";

const MAX_HISTORY_MESSAGES = 40;

function sectionsToContext(sections: BrandSection[]): string {
  const blocks: string[] = [];

  for (const section of sections) {
    if (section.kind === "document") {
      if (section.content.trim()) {
        blocks.push(`### ${section.label}\n${section.content}`);
      }
    } else {
      if (section.items.length > 0) {
        const items = section.items
          .map((item) => {
            let text = `- **${item.title}**: ${item.content}`;
            if (item.metadata && Object.keys(item.metadata).length > 0) {
              const meta = Object.entries(item.metadata)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
              text += ` (${meta})`;
            }
            return text;
          })
          .join("\n");
        blocks.push(`### ${section.label}\n${items}`);
      }
    }
  }

  return blocks.join("\n\n");
}

export function buildChatPrompt(
  brandId: string,
  brandName: string,
  sections: BrandSection[],
  messages: ChatMessage[],
  newMessage: string
): string {
  const vaultContext = sectionsToContext(sections);

  const systemBlock = [
    `You are a brand strategist and content expert for the brand "${brandName}" (ID: ${brandId}).`,
    ``,
    `## Brand Vault (Source of Truth)`,
    `The following is the complete brand vault for ${brandName}. ALWAYS use this data when answering questions about the brand. Do NOT make up brand details.`,
    ``,
    vaultContext,
    ``,
    `## Instructions`,
    `- Use the brand vault above as your primary source of truth for brand voice, tone, style, colors, typography, audiences, products, and examples.`,
    `- You also have access to MCP tools for deeper searches:`,
    `  - recall: search brand memories for additional context`,
    `  - get_brand_context: reload the full brand context`,
    `  - get_platform_specs: get platform-specific content specs`,
    `  - get_campaign: reference active campaigns`,
    `  - get_approved_content: reference past successful content`,
    `  - log_feedback / remember: store user feedback`,
    `- Always stay on brand. Never invent brand details that aren't in the vault above.`,
    `- Be conversational, helpful, and specific.`,
    `- Format responses with markdown for readability.`,
  ].join("\n");

  const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  const historyBlock = recentMessages
    .map((msg) => {
      const prefix = msg.role === "user" ? "Human" : "Assistant";
      return `${prefix}: ${msg.content}`;
    })
    .join("\n\n");

  const parts = [systemBlock];
  if (historyBlock) {
    parts.push("");
    parts.push("--- Conversation History ---");
    parts.push(historyBlock);
    parts.push("--- End History ---");
  }
  parts.push("");
  parts.push(`Human: ${newMessage}`);

  return parts.join("\n");
}
