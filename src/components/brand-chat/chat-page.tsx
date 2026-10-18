import { useChatStore } from "@/stores/chat-store";
import { useBrandStore } from "@/stores/brand-store";
import { useChat } from "@/hooks/use-chat";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { IconMessageChatbot, IconPlus } from "@tabler/icons-react";

export function ChatPage() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const { isGenerating, streamOutput, sendMessage, stop } = useChat();

  if (!activeConversation) {
    return (
      <EmptyState
        icon={IconMessageChatbot}
        title="Brand Chat"
        description="Chat with your brand brain. Ask about your brand voice, generate content ideas, or get feedback on copy."
        action={
          activeBrandId ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1.5"
              onClick={() => createConversation(activeBrandId)}
            >
              <IconPlus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatMessageList
        messages={activeConversation.messages}
        streamOutput={streamOutput}
        isGenerating={isGenerating}
      />
      <ChatInput
        onSend={sendMessage}
        onStop={stop}
        isGenerating={isGenerating}
      />
    </div>
  );
}
