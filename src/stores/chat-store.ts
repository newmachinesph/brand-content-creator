import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { ChatConversation, ChatMessage } from "@/types/chat";

const MAX_CONVERSATIONS = 50;

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;

  createConversation: (brandId: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (
    conversationId: string,
    msg: Omit<ChatMessage, "id" | "timestamp">
  ) => void;
  updateLastAssistantMessage: (
    conversationId: string,
    content: string
  ) => void;
  clearConversations: (brandId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    immer((set) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: (brandId) => {
        const id = nanoid();
        const now = new Date().toISOString();
        set((state) => {
          state.conversations.unshift({
            id,
            brandId,
            title: "New Chat",
            messages: [],
            createdAt: now,
            updatedAt: now,
          });
          state.activeConversationId = id;
          if (state.conversations.length > MAX_CONVERSATIONS) {
            state.conversations = state.conversations.slice(
              0,
              MAX_CONVERSATIONS
            );
          }
        });
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          state.conversations = state.conversations.filter((c) => c.id !== id);
          if (state.activeConversationId === id) {
            state.activeConversationId = state.conversations[0]?.id ?? null;
          }
        });
      },

      setActiveConversation: (id) => {
        set((state) => {
          state.activeConversationId = id;
        });
      },

      addMessage: (conversationId, msg) => {
        set((state) => {
          const conv = state.conversations.find(
            (c) => c.id === conversationId
          );
          if (!conv) return;
          conv.messages.push({
            id: nanoid(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date().toISOString(),
          });
          conv.updatedAt = new Date().toISOString();
          if (conv.title === "New Chat" && msg.role === "user") {
            conv.title =
              msg.content.slice(0, 50) +
              (msg.content.length > 50 ? "..." : "");
          }
        });
      },

      updateLastAssistantMessage: (conversationId, content) => {
        set((state) => {
          const conv = state.conversations.find(
            (c) => c.id === conversationId
          );
          if (!conv) return;
          const lastMsg = conv.messages[conv.messages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = content;
          }
        });
      },

      clearConversations: (brandId) => {
        set((state) => {
          state.conversations = state.conversations.filter(
            (c) => c.brandId !== brandId
          );
          if (
            state.activeConversationId &&
            !state.conversations.find(
              (c) => c.id === state.activeConversationId
            )
          ) {
            state.activeConversationId = null;
          }
        });
      },
    })),
    {
      name: "brand-chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
