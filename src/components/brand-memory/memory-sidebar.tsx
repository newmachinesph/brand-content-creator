import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconLoader2,
  IconHeart,
  IconBan,
  IconCircleCheck,
  IconMessageCircle,
  IconBrush,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMemoryStore } from "@/stores/memory-store";
import { useBrandStore } from "@/stores/brand-store";
import { MemoryCard } from "./memory-card";
import type { BrandMemory } from "@/types/memory";
import type { MemoryType } from "@/types/common";

// ─── Filter configuration ────────────────────────────────────────

type FilterTab = "all" | MemoryType;

const TYPE_FILTERS: {
  value: MemoryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dotColor: string;
  activeColor: string;
}[] = [
  {
    value: "preference",
    label: "Likes",
    icon: IconHeart,
    dotColor: "bg-blue-400",
    activeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    value: "rejection",
    label: "Dislikes",
    icon: IconBan,
    dotColor: "bg-red-400",
    activeColor: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  {
    value: "approval",
    label: "Approved",
    icon: IconCircleCheck,
    dotColor: "bg-green-400",
    activeColor: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  {
    value: "feedback",
    label: "Feedback",
    icon: IconMessageCircle,
    dotColor: "bg-amber-400",
    activeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  {
    value: "learned_style",
    label: "Patterns",
    icon: IconBrush,
    dotColor: "bg-purple-400",
    activeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
];

// ─── Component ───────────────────────────────────────────────────

interface MemorySidebarProps {
  onCreateMemory: () => void;
}

export function MemorySidebar({ onCreateMemory }: MemorySidebarProps) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const memories = useMemoryStore((s) => s.memories);
  const activeMemoryId = useMemoryStore((s) => s.activeMemoryId);
  const setActiveMemory = useMemoryStore((s) => s.setActiveMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const archiveMemory = useMemoryStore((s) => s.archiveMemory);
  const searchResults = useMemoryStore((s) => s.searchResults);
  const isSearching = useMemoryStore((s) => s.isSearching);
  const semanticSearch = useMemoryStore((s) => s.semanticSearch);
  const clearSearch = useMemoryStore((s) => s.clearSearch);
  const loadMemories = useMemoryStore((s) => s.loadMemories);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchActive = searchResults.length > 0 || isSearching;

  // Load memories when brand changes
  useEffect(() => {
    if (activeBrandId) {
      loadMemories(activeBrandId);
    }
  }, [activeBrandId, loadMemories]);

  // Count memories per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: memories.length };
    for (const m of memories) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
    }
    return counts;
  }, [memories]);

  // Debounced semantic search
  const triggerSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!query.trim()) {
        clearSearch();
        return;
      }

      debounceRef.current = setTimeout(() => {
        if (activeBrandId && query.trim()) {
          semanticSearch(activeBrandId, query.trim());
        }
      }, 500);
    },
    [activeBrandId, semanticSearch, clearSearch]
  );

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    triggerSearch(value);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && searchQuery.trim() && activeBrandId) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      semanticSearch(activeBrandId, searchQuery.trim());
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    clearSearch();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }

  // Determine which memories to display
  const displayMemories = isSearchActive
    ? searchResults
    : activeTab === "all"
      ? memories
      : memories.filter((m) => m.type === activeTab);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Search input */}
      <div className="shrink-0 px-2 pt-2">
        <div className="relative">
          <IconSearch className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {isSearching && (
            <IconLoader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {!isSearching && searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clear search indicator */}
      {isSearchActive && !isSearching && (
        <div className="flex shrink-0 items-center justify-between px-3 py-1">
          <span className="text-[11px] text-muted-foreground">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleClearSearch}
            className="text-[11px] text-primary hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter row (hidden during search) */}
      {!isSearchActive && (
        <div className="flex shrink-0 items-center gap-1 px-2.5 pt-1.5 pb-0.5">
          {/* All button */}
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              activeTab === "all"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            All
            <span className="ml-1 opacity-60">{typeCounts.all || 0}</span>
          </button>

          <span className="mx-0.5 h-3 w-px bg-border" />

          {/* Type filter icons */}
          {TYPE_FILTERS.map((opt) => {
            const count = typeCounts[opt.value] ?? 0;
            const isActive = activeTab === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setActiveTab(opt.value)}
                title={`${opt.label} (${count})`}
                className={cn(
                  "relative flex items-center gap-1 rounded-md border px-1.5 py-1 transition-colors",
                  isActive
                    ? opt.activeColor
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {count > 0 && (
                  <span className="text-[10px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Memory list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
        <div className="flex flex-col gap-px">
          {displayMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                {isSearchActive
                  ? "No matching memories found."
                  : "No memories yet."}
              </p>
            </div>
          ) : (
            displayMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                isActive={activeMemoryId === memory.id}
                similarity={
                  "similarity" in memory
                    ? (memory as BrandMemory & { similarity: number }).similarity
                    : undefined
                }
                onClick={() => setActiveMemory(memory.id)}
                onDelete={() => deleteMemory(memory.id)}
                onArchive={() => archiveMemory(memory.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* New Memory button */}
      <div className="shrink-0 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onCreateMemory}
        >
          <IconPlus className="h-4 w-4" />
          New Memory
        </Button>
      </div>
    </div>
  );
}
