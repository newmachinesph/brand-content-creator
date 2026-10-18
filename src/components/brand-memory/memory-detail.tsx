import { useState, useCallback } from "react";
import {
  IconBrain,
  IconEdit,
  IconStar,
  IconStarFilled,
  IconCalendar,
  IconTag,
  IconLock,
  IconLoader2,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMemoryStore } from "@/stores/memory-store";
import { useBrandStore } from "@/stores/brand-store";
import { EmptyState } from "@/components/shared/empty-state";
import { MemoryForm } from "./memory-form";
import type { MemoryType, MemorySource } from "@/types/common";

// ─── Type / source styling ───────────────────────────────────────

const TYPE_BADGE_CLASSES: Record<MemoryType, string> = {
  preference: "bg-blue-500/20 text-blue-400",
  rejection: "bg-red-500/20 text-red-400",
  approval: "bg-green-500/20 text-green-400",
  feedback: "bg-amber-500/20 text-amber-400",
  learned_style: "bg-purple-500/20 text-purple-400",
};

const TYPE_LABELS: Record<MemoryType, string> = {
  preference: "Brand Likes",
  rejection: "Brand Dislikes",
  approval: "Approved Pattern",
  feedback: "Feedback",
  learned_style: "Learned Pattern",
};

const SOURCE_LABELS: Record<MemorySource, string> = {
  manual: "Manual",
  auto_rejection: "Auto (Rejection)",
  auto_approval: "Auto (Approval)",
  import: "Imported",
  vault_sync: "Brand Vault",
};

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────────

function similarityColor(similarity: number): string {
  if (similarity > 0.8) return "text-green-500 bg-green-500/20";
  if (similarity > 0.5) return "text-yellow-500 bg-yellow-500/20";
  return "text-red-500 bg-red-500/20";
}

export function MemoryDetail() {
  const activeMemory = useMemoryStore((s) => s.getActiveMemory());
  const searchResults = useMemoryStore((s) => s.searchResults);
  const isSearching = useMemoryStore((s) => s.isSearching);
  const semanticSearch = useMemoryStore((s) => s.semanticSearch);
  const clearSearch = useMemoryStore((s) => s.clearSearch);
  const setActiveMemory = useMemoryStore((s) => s.setActiveMemory);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isVaultSync = activeMemory?.source === "vault_sync";

  const handleFindRelated = useCallback(() => {
    if (!activeMemory || !activeBrandId) return;
    semanticSearch(activeBrandId, activeMemory.title + " " + activeMemory.content);
  }, [activeMemory, activeBrandId, semanticSearch]);

  if (!activeMemory) {
    return (
      <EmptyState
        icon={IconBrain}
        title="No memory selected"
        description="Select a memory from the sidebar to view its details."
      />
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          {/* ── Header ───────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <h1 className="text-lg font-semibold text-foreground">
                  {activeMemory.title}
                </h1>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                    TYPE_BADGE_CLASSES[activeMemory.type]
                  )}
                >
                  {TYPE_LABELS[activeMemory.type]}
                </span>
              </div>

              {!isVaultSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <IconEdit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {/* Source badge + importance stars */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[11px]">
                {SOURCE_LABELS[activeMemory.source]}
              </Badge>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) =>
                  i < activeMemory.importance ? (
                    <IconStarFilled
                      key={i}
                      className="h-3.5 w-3.5 text-amber-400"
                    />
                  ) : (
                    <IconStar
                      key={i}
                      className="h-3.5 w-3.5 text-muted-foreground/40"
                    />
                  )
                )}
                <span className="ml-1 text-[11px] text-muted-foreground">
                  Importance {activeMemory.importance}/5
                </span>
              </div>
            </div>
          </div>

          {/* ── Vault sync notice ─────────────────────────── */}
          {isVaultSync && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <IconLock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">
                Synced from Brand Vault. Edit this content in the vault to update this memory.
              </p>
            </div>
          )}

          <Separator />

          {/* ── Content ──────────────────────────────────────── */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-foreground">Content</h2>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
              {activeMemory.content}
            </p>
          </div>

          {/* ── Find Related ─────────────────────────────────── */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleFindRelated}
              disabled={isSearching}
            >
              {isSearching ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconBrain className="h-4 w-4" />
              )}
              {isSearching ? "Searching..." : "Find Related"}
            </Button>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">
                    Related Memories
                  </h2>
                  <button
                    onClick={clearSearch}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {searchResults
                    .filter((r) => r.id !== activeMemory.id)
                    .map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setActiveMemory(result.id)}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {result.title}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {result.content.slice(0, 80)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            similarityColor(result.similarity)
                          )}
                        >
                          {Math.round(result.similarity * 100)}% similar
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Tags ─────────────────────────────────────────── */}
          {activeMemory.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IconTag className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-6">
                {activeMemory.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Dates ────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Timeline</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Created
                </p>
                <p className="text-[13px] text-foreground">
                  {formatDate(activeMemory.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Updated
                </p>
                <p className="text-[13px] text-foreground">
                  {formatDate(activeMemory.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Metadata footer ──────────────────────────────── */}
          <Separator />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>ID: {activeMemory.id}</span>
            <span>
              {activeMemory.isActive ? "Active" : "Archived"}
            </span>
          </div>
        </div>
      </ScrollArea>

      <MemoryForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editMemory={activeMemory}
      />
    </>
  );
}
