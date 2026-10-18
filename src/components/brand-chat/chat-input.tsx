import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSend, IconPlayerStop } from "@tabler/icons-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export function ChatInput({ onSend, onStop, isGenerating }: ChatInputProps) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your brand..."
          disabled={isGenerating}
          className="min-h-10 max-h-32 resize-none rounded-md"
          rows={1}
        />
        {isGenerating ? (
          <Button
            variant="destructive"
            size="icon"
            className="shrink-0"
            onClick={onStop}
          >
            <IconPlayerStop className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <IconSend className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
