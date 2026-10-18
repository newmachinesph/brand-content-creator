import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import { useBrandStore } from "@/stores/brand-store";
import { downloadBrandKitJson } from "@/lib/export";
import { toast } from "sonner";

export function ExportButton() {
  const exportToJson = useBrandStore((s) => s.exportToJson);

  function handleExport() {
    const data = exportToJson();
    if (!data) return;
    downloadBrandKitJson(data);
    toast.success("Brand kit exported as JSON");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleExport}
    >
      <IconDownload className="h-4 w-4" />
      Export JSON
    </Button>
  );
}
