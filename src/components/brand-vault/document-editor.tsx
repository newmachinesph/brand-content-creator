import { useState, useCallback } from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useBrandStore } from "@/stores/brand-store";
import { useAutosave } from "@/hooks/use-autosave";
import type { DocumentSection } from "@/types/brand";

interface DocumentEditorProps {
  section: DocumentSection;
}

export function DocumentEditor({ section }: DocumentEditorProps) {
  // Use updatedAt in key so editor remounts after external changes (e.g. auto-fill)
  const editorKey = `${section.id}-${section.updatedAt}`;
  const [value, setValue] = useState(section.content);
  const updateDocumentContent = useBrandStore(
    (s) => s.updateDocumentContent
  );

  const handleSave = useCallback(
    (content: string) => {
      updateDocumentContent(section.id, content);
    },
    [section.id, updateDocumentContent]
  );

  useAutosave(value, handleSave);

  return (
    <div className="flex h-full flex-col p-6">
      <MarkdownEditor
        key={editorKey}
        defaultValue={section.content}
        onChange={setValue}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">
        Auto-saved &middot; Last updated{" "}
        {new Date(section.updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
