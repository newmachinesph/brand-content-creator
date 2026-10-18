import { useCallback, useRef } from "react";
import { useGeneration } from "@/hooks/use-generation";
import { useChatStore } from "@/stores/chat-store";
import { useBrandStore } from "@/stores/brand-store";
import { buildChatPrompt } from "@/lib/chat-prompt";

export function useChat() {
  const activeConvRef = useRef<string | null>(null);

  const { isGenerating, streamOutput, generate, stop, clear } = useGeneration({
    onComplete: (content) => {
      const convId = activeConvRef.current;
      if (convId) {
        useChatStore.getState().updateLastAssistantMessage(convId, content);
      }
    },
  });

  const sendMessage = useCallback(
    async (text: string) => {
      const brandState = useBrandStore.getState();
      const activeBrandId = brandState.activeBrandId;
      const activeBrand = brandState.brandKits.find(
        (b) => b.id === activeBrandId
      );
      if (!activeBrandId || !activeBrand) return;

      const chatState = useChatStore.getState();

      // Ensure there is an active conversation
      let convId = chatState.activeConversationId;
      if (!convId) {
        convId = chatState.createConversation(activeBrandId);
      }
      activeConvRef.current = convId;

      // Add user message
      useChatStore.getState().addMessage(convId, { role: "user", content: text });

      // Add empty assistant placeholder
      useChatStore
        .getState()
        .addMessage(convId, { role: "assistant", content: "" });

      // Build prompt with history (excluding the empty placeholder)
      const conv = useChatStore
        .getState()
        .conversations.find((c) => c.id === convId);
      const allMessages = conv?.messages ?? [];
      const historyForPrompt = allMessages.slice(0, -1); // exclude empty placeholder

      const prompt = buildChatPrompt(
        activeBrandId,
        activeBrand.name,
        activeBrand.sections,
        historyForPrompt,
        text
      );

      clear();
      await generate(prompt);
    },
    [generate, clear]
  );

  return { isGenerating, streamOutput, sendMessage, stop };
}
