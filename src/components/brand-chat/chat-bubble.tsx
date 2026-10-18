import { useState } from "react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { IconCopy, IconCheck } from "@tabler/icons-react";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-muted-foreground/50 transition-colors hover:bg-background/50 hover:text-muted-foreground"
      title="Copy to clipboard"
    >
      {copied ? (
        <IconCheck className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <IconCopy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  const isUser = role === "user";
  const showCopy = content.trim().length > 0 && !isStreaming;

  return (
    <div className={cn("group flex", isUser ? "justify-end" : "justify-start")}>
      <div className="flex flex-col items-end gap-0.5">
        <div
          className={cn(
            "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : content ? (
            <MarkdownContent content={content} />
          ) : isStreaming ? (
            <TypingIndicator />
          ) : null}
          {isStreaming && content && (
            <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-muted-foreground/50" />
          )}
        </div>
        {showCopy && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </div>
  );
}
