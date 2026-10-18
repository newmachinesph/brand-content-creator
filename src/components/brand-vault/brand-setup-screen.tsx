import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBrandStore } from "@/stores/brand-store";
import { readJsonFile } from "@/lib/export";
import { toast } from "sonner";
import {
  IconSparkles,
  IconUpload,
  IconChevronRight,
  IconArrowLeft,
} from "@tabler/icons-react";

interface BrandSetupScreenProps {
  onBack?: () => void;
}

export function BrandSetupScreen({ onBack }: BrandSetupScreenProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const brandKits = useBrandStore((s) => s.brandKits);
  const createBrandKit = useBrandStore((s) => s.createBrandKit);
  const setActiveBrand = useBrandStore((s) => s.setActiveBrand);
  const importFromJson = useBrandStore((s) => s.importFromJson);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCreate() {
    if (!name.trim()) return;
    createBrandKit(name.trim(), description.trim());
    setName("");
    setDescription("");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readJsonFile(file);
      importFromJson(data);
      toast.success("Brand kit imported");
    } catch {
      toast.error("Failed to import — invalid JSON file");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background bg-terminal-pattern">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={onBack}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div className="text-center">
          <IconSparkles className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-xl font-semibold text-foreground">
            {brandKits.length === 0
              ? "Create Your First Brand"
              : "Create a New Brand"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a brand identity to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-desc">Description (optional)</Label>
            <Input
              id="brand-desc"
              placeholder="AI-powered productivity tools"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          Create Brand Kit
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-3 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <IconUpload className="h-4 w-4" />
          Import from JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        {/* Existing brands list */}
        {brandKits.length > 0 && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground">
                existing brands
              </span>
            </div>
            <div className="space-y-1.5">
              {brandKits.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.id)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {brand.name}
                    </p>
                    {brand.description && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {brand.description}
                      </p>
                    )}
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
