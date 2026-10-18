import { useBrandStore } from "@/stores/brand-store";
import { DocumentEditor } from "./document-editor";
import { ListEditor } from "./list-editor";
import type { SectionId } from "@/types/brand";

interface SectionEditorProps {
  sectionId: SectionId;
}

export function SectionEditor({ sectionId }: SectionEditorProps) {
  const section = useBrandStore((s) => {
    const brand = s.brandKits.find((b) => b.id === s.activeBrandId);
    return brand?.sections.find((sec) => sec.id === sectionId);
  });

  if (!section) return null;

  if (section.kind === "document") {
    return <DocumentEditor key={section.id} section={section} />;
  }

  return <ListEditor key={section.id} section={section} />;
}
