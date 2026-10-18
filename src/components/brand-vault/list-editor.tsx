import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrandStore } from "@/stores/brand-store";
import { ListItemCard } from "./list-item-card";
import { ListItemForm } from "./list-item-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { IconPlus, IconListDetails } from "@tabler/icons-react";
import type { ListSection, BrandListItem } from "@/types/brand";

interface ListEditorProps {
  section: ListSection;
}

export function ListEditor({ section }: ListEditorProps) {
  const addListItem = useBrandStore((s) => s.addListItem);
  const updateListItem = useBrandStore((s) => s.updateListItem);
  const removeListItem = useBrandStore((s) => s.removeListItem);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrandListItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function handleAdd() {
    setEditingItem(undefined);
    setFormOpen(true);
  }

  function handleEdit(item: BrandListItem) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleSave(data: {
    title: string;
    content: string;
    metadata?: Record<string, string>;
  }) {
    if (editingItem) {
      updateListItem(section.id, editingItem.id, data);
    } else {
      addListItem(section.id, data);
    }
  }

  function handleConfirmDelete() {
    if (deleteTarget) {
      removeListItem(section.id, deleteTarget);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {section.items.length} item{section.items.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleAdd}>
          <IconPlus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* List */}
      {section.items.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            icon={IconListDetails}
            title="No items yet"
            description={`Add your first item to ${section.label.toLowerCase()}.`}
            action={
              <Button size="sm" variant="outline" onClick={handleAdd}>
                <IconPlus className="mr-1.5 h-4 w-4" />
                Add Item
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-3">
            {section.items.map((item) => (
              <ListItemCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => setDeleteTarget(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <ListItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete item"
        description="This item will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
