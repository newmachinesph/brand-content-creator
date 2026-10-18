import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { BrandListItem } from "@/types/brand";

interface ListItemCardProps {
  item: BrandListItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function ListItemCard({ item, onEdit, onDelete }: ListItemCardProps) {
  return (
    <div className="group rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
          <div className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
            <MarkdownContent content={item.content} />
          </div>
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(item.metadata).map(([key, val]) => (
                <Badge key={key} variant="secondary" className="text-[11px]">
                  {key}: {val}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <IconPencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
