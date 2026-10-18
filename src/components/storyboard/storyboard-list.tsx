import { useStoryboardStore } from "@/stores/storyboard-store";
import { IconLayoutBoard, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDots } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";

export function StoryboardList() {
  const storyboards = useStoryboardStore((s) => s.storyboards);
  const activeStoryboardId = useStoryboardStore((s) => s.activeStoryboardId);
  const setActiveStoryboard = useStoryboardStore(
    (s) => s.setActiveStoryboard
  );
  const deleteStoryboard = useStoryboardStore((s) => s.deleteStoryboard);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (deleteId) {
      deleteStoryboard(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        {storyboards.map((sb) => {
          const isActive = sb.id === activeStoryboardId;
          return (
            <div key={sb.id} className="group flex items-center">
              <button
                onClick={() => setActiveStoryboard(sb.id)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <IconLayoutBoard
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive && "text-sidebar-primary"
                  )}
                />
                <span className="truncate">{sb.name}</span>
                {(sb.items?.length ?? 0) > 0 && (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {sb.items.length}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <IconDots className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDeleteId(sb.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        {storyboards.length === 0 && (
          <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
            No storyboards yet
          </p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete storyboard?"
        description="This will permanently remove this storyboard and all its content items."
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
