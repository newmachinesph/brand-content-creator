import { useState, useMemo } from "react";
import { useBrandStore } from "@/stores/brand-store";
import { useChatStore } from "@/stores/chat-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPlus, IconTrash, IconSearch } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function ChatConversationItem({
  id,
  title,
  messageCount,
  isActive,
  onClick,
  onDelete,
}: {
  id: string;
  title: string;
  messageCount: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <span className="flex-1 truncate">{title}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {messageCount}
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        title="Delete conversation"
      >
        <IconTrash className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ChatSidebar() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const [searchQuery, setSearchQuery] = useState("");

  const brandConversations = conversations
    .filter((c) => c.brandId === activeBrandId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return brandConversations;
    return brandConversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  }, [brandConversations, searchQuery]);

  return (
    <>
      <div className="px-2 pt-2">
        <div className="relative">
          <IconSearch className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-7"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {brandConversations.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          ) : filteredConversations.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
              No results found
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <ChatConversationItem
                key={conv.id}
                id={conv.id}
                title={conv.title}
                messageCount={conv.messages.length}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (activeBrandId) createConversation(activeBrandId);
          }}
        >
          <IconPlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </>
  );
}
