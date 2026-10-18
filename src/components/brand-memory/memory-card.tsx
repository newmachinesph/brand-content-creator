import { useState } from "react";
import {
  IconDots,
  IconTrash,
  IconArchive,
  IconStarFilled,
  IconLock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { BrandMemory } from "@/types/memory";
import type { MemoryType } from "@/types/common";

// ─── Type styling ────────────────────────────────────────────────

const TYPE_DOT_COLOR: Record<MemoryType, string> = {
  preference: "bg-blue-400",
  rejection: "bg-red-400",
  approval: "bg-green-400",
  feedback: "bg-amber-400",
  learned_style: "bg-purple-400",
};

// ─── Component ───────────────────────────────────────────────────

interface MemoryCardProps {
  memory: BrandMemory;
  isActive: boolean;
  similarity?: number;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

export function MemoryCard({
  memory,
  isActive,
  similarity,
  onClick,
  onDelete,
  onArchive,
}: MemoryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isVaultSync = memory.source === "vault_sync";

  const visibleTags = memory.tags.slice(0, 2);
  const extraTags = memory.tags.length - 2;

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full flex-col gap-1 rounded-md px-2.5 py-2 text-left transition-colors",
          isActive
            ? "bg-primary/10 text-foreground"
            : "text-foreground/80 hover:bg-muted/50"
        )}
      >
        {/* Row 1: type dot + title + actions */}
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full",
              TYPE_DOT_COLOR[memory.type]
            )}
          />
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug line-clamp-2">
            {memory.title}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            {/* Vault-synced indicator */}
            {isVaultSync && (
              <IconLock className="h-3 w-3 text-muted-foreground/50" />
            )}

            {/* Importance (compact) */}
            {memory.importance >= 4 && !isVaultSync && (
              <IconStarFilled className="h-3 w-3 text-amber-400/70" />
            )}

            {/* Similarity (search) */}
            {similarity !== undefined && (
              <span className="text-[10px] font-medium text-primary">
                {Math.round(similarity * 100)}%
              </span>
            )}

            {/* Actions menu — hidden for vault-synced (managed by vault) */}
            {!isVaultSync && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDots className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onArchive}>
                    <IconArchive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Row 2: content preview (max 3 lines) — hidden for vault-synced */}
        {!isVaultSync && (
          <p className="pl-4 text-[12px] leading-normal text-muted-foreground line-clamp-3">
            {memory.content}
          </p>
        )}

        {/* Row 3: tags (max 2 + overflow) */}
        {visibleTags.length > 0 && (
          <div className="flex items-center gap-1 pl-4">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-px text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-[10px] text-muted-foreground/60">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete memory?"
        description={`This will permanently remove "${memory.title}" from brand memory.`}
        onConfirm={onDelete}
      />
    </>
  );
}
