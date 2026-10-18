import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBrandStore } from "@/stores/brand-store";
import { useGeneration } from "@/hooks/use-generation";
import { buildBrandFillPrompt } from "@/lib/prompt-builder/brand-fill-prompt";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconPlus,
  IconSparkles,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";

type Step = "confirm" | "urls" | "generating";

/** Extract a JSON object from Claude's output, handling various wrappings */
function extractJson(raw: string): { documents: Record<string, string>; lists: Record<string, Array<{ title: string; content: string; metadata?: Record<string, string> }>> } {
  let text = raw.trim();

  // Try 1: Remove markdown code fences (```json ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Try 2: Direct parse
  try {
    const parsed = JSON.parse(text);
    if (parsed.documents && parsed.lists) return parsed;
  } catch { /* continue */ }

  // Try 3: Find the first { ... } that contains "documents"
  const startIdx = text.indexOf("{");
  if (startIdx >= 0) {
    // Find the matching closing brace by counting nesting
    let depth = 0;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(startIdx, i + 1);
          try {
            const parsed = JSON.parse(candidate);
            if (parsed.documents && parsed.lists) return parsed;
          } catch { /* continue searching */ }
        }
      }
    }
  }

  throw new Error("Could not find valid JSON with 'documents' and 'lists' in the AI response");
}

interface AutoFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function hasExistingContent(
  sections: { kind: string; content?: string; items?: unknown[] }[]
): boolean {
  return sections.some((s) => {
    if (s.kind === "document" && s.content && s.content.trim().length > 0)
      return true;
    if (s.kind === "list" && s.items && s.items.length > 0) return true;
    return false;
  });
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AutoFillDialog({ open, onOpenChange }: AutoFillDialogProps) {
  const brand = useBrandStore((s) =>
    s.brandKits.find((b) => b.id === s.activeBrandId)
  );
  const replaceAllSections = useBrandStore((s) => s.replaceAllSections);
  const saveReferenceUrls = useBrandStore((s) => s.saveReferenceUrls);

  const needsConfirm = brand ? hasExistingContent(brand.sections) : false;
  const [step, setStep] = useState<Step>(needsConfirm ? "confirm" : "urls");
  const [urls, setUrls] = useState<string[]>([""]);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef("");

  const { isGenerating, streamOutput, generate, stop } = useGeneration({
    onComplete: useCallback(
      (content: string) => {
        try {
          const parsed = extractJson(content);
          replaceAllSections(parsed);
          toast.success("Brand vault auto-filled successfully");
          handleClose();
        } catch (err) {
          setError(
            `Failed to parse AI response: ${err instanceof Error ? err.message : String(err)}. You can try again.`
          );
          setStep("urls");
        }
      },
      [replaceAllSections]
    ),
    onError: useCallback((errMsg: string) => {
      setError(errMsg);
      setStep("urls");
    }, []),
  });

  function handleClose() {
    if (isGenerating) return;
    onOpenChange(false);
    // Reset state after dialog animation (URLs are preserved via DB)
    setTimeout(() => {
      setStep(needsConfirm ? "confirm" : "urls");
      setStatusText("");
      setError(null);
      outputRef.current = "";
    }, 200);
  }

  function addUrl() {
    setUrls([...urls, ""]);
  }

  function updateUrl(index: number, value: string) {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
  }

  function removeUrl(index: number) {
    if (urls.length <= 1) return;
    setUrls(urls.filter((_, i) => i !== index));
  }

  const validUrls = urls.filter((u) => isValidUrl(u.trim()));

  async function handleGenerate() {
    if (!brand || validUrls.length === 0) return;

    // Persist the URLs for next time
    saveReferenceUrls(urls.filter((u) => u.trim().length > 0));

    setStep("generating");
    setError(null);
    setStatusText("Fetching websites...");

    // Fetch all URLs
    const websiteContents: { url: string; content: string }[] = [];
    const failures: string[] = [];

    for (const url of validUrls) {
      try {
        const content = await invoke<string>("fetch_url", { url: url.trim() });
        websiteContents.push({ url: url.trim(), content });
      } catch (err) {
        failures.push(`${url}: ${err}`);
      }
    }

    if (websiteContents.length === 0) {
      setError(
        `Failed to fetch all URLs:\n${failures.join("\n")}`
      );
      setStep("urls");
      return;
    }

    if (failures.length > 0) {
      toast.warning(
        `Could not fetch ${failures.length} URL(s). Proceeding with ${websiteContents.length} source(s).`
      );
    }

    setStatusText("Generating brand vault content...");

    const prompt = buildBrandFillPrompt(
      brand.name,
      brand.description,
      websiteContents
    );

    await generate(prompt);
  }

  function handleConfirmOverride() {
    setStep("urls");
  }

  // Reset step when dialog opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const currentBrand = useBrandStore.getState().getActiveBrand();
      const needs = currentBrand ? hasExistingContent(currentBrand.sections) : false;
      setStep(needs ? "confirm" : "urls");
      // Restore saved URLs or start with one empty input
      const saved = currentBrand?.referenceUrls;
      setUrls(saved && saved.length > 0 ? [...saved] : [""]);
      setError(null);
      setStatusText("");
      outputRef.current = "";
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isGenerating}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="h-4 w-4 text-primary" />
            Auto-fill Brand Vault
          </DialogTitle>
          {step === "urls" && (
            <DialogDescription>
              Provide reference websites so AI can analyze your brand and fill
              all vault sections automatically.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: Confirm override */}
        {step === "confirm" && (
          <>
            <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Existing content will be replaced
                </p>
                <p className="text-xs text-muted-foreground">
                  The brand vault for <strong>{brand?.name}</strong> already has
                  content. Auto-filling will clear and override all existing
                  sections.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirmOverride}>Continue</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: URL input */}
        {step === "urls" && (
          <>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label>Reference URLs</Label>
              {urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="https://yourcompany.com"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                  />
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeUrl(i)}
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground"
                onClick={addUrl}
              >
                <IconPlus className="h-3 w-3" />
                Add another URL
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={validUrls.length === 0}
                className="gap-2"
              >
                <IconSparkles className="h-3.5 w-3.5" />
                Generate
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="h-4 w-4 animate-spin" />
                {statusText}
              </div>
              {streamOutput && (
                <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
                  <pre className="whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                    {streamOutput}
                  </pre>
                </ScrollArea>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={async () => {
                  await stop();
                  setStep("urls");
                  setStatusText("");
                }}
              >
                Stop
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
