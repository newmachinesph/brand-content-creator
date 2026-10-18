import { useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/types/chat";
import { ChatBubble } from "./chat-bubble";

interface ChatMessageListProps {
  messages: ChatMessage[];
  streamOutput: string;
  isGenerating: boolean;
}

export function ChatMessageList({
  messages,
  streamOutput,
  isGenerating,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (isNearBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, streamOutput, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const isStreamingMsg =
            isLast && msg.role === "assistant" && isGenerating;
          const displayContent = isStreamingMsg ? streamOutput : msg.content;

          return (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={displayContent}
              isStreaming={isStreamingMsg}
            />
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
