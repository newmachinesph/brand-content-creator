import { useBrandStore } from "@/stores/brand-store";
import { useAppStore } from "@/stores/app-store";
import { ExportButton } from "@/components/brand-vault/export-button";

export function Header() {
  const activeModule = useAppStore((s) => s.activeModule);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  return (
    <header
      data-tauri-drag-region
      className="flex h-9 shrink-0 items-end justify-end bg-background/80 px-4"
    >
      {activeBrandId && activeModule === "brand-vault" && <ExportButton />}
    </header>
  );
}
