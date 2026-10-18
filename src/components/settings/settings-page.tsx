import { useEffect, useState, useCallback } from "react";
import {
  IconSettings,
  IconPalette,
  IconRobot,
  IconDevices,
  IconPrompt,
  IconRotateClockwise,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import { usePromptTemplateStore } from "@/stores/prompt-template-store";
import { useBrandStore } from "@/stores/brand-store";
import { useSettingsSidebar } from "./settings-sidebar";
import { PLATFORM_LABELS } from "@/types/common";
import {
  PROMPT_TEMPLATE_KEYS,
  AVAILABLE_PLACEHOLDERS,
} from "@/types/prompt-template";

// ── Main Settings Page ──────────────────────────────────────────

export function SettingsPage() {
  const activeSection = useSettingsSidebar((s) => s.activeSection);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl space-y-8 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your Brand Content Studio preferences.
          </p>
        </div>

        <Separator />

        {activeSection === "appearance" && <AppearanceSection />}
        {activeSection === "ai-engine" && <AIEngineSection />}
        {activeSection === "defaults" && <DefaultsSection />}
        {activeSection === "prompt-templates" && <PromptTemplatesSection />}
      </div>
    </ScrollArea>
  );
}

// ── Appearance ──────────────────────────────────────────────────

function AppearanceSection() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <IconPalette className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Appearance</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={settings.theme}
            onValueChange={(v) =>
              updateSetting("theme", v as "dark" | "light" | "system")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Compact Mode</Label>
          <Select
            value={settings.compactMode ? "true" : "false"}
            onValueChange={(v) => updateSetting("compactMode", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Normal</SelectItem>
              <SelectItem value="true">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

// ── AI Engine ───────────────────────────────────────────────────

function AIEngineSection() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <IconRobot className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">AI Engine</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Claude Model</Label>
          <Select
            value={settings.claudeModel}
            onValueChange={(v) => updateSetting("claudeModel", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-6">
                Claude Sonnet 4.6
              </SelectItem>
              <SelectItem value="claude-opus-4-6">Claude Opus 4.6</SelectItem>
              <SelectItem value="claude-haiku-4-5-20251001">
                Claude Haiku 4.5
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Auto-save</Label>
          <Select
            value={settings.autoSave ? "true" : "false"}
            onValueChange={(v) => updateSetting("autoSave", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Enabled</SelectItem>
              <SelectItem value="false">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

// ── Defaults ────────────────────────────────────────────────────

function DefaultsSection() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <IconDevices className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Defaults</h3>
        </div>
        <div className="space-y-2">
          <Label>Default Platform</Label>
          <Select
            value={settings.defaultPlatform}
            onValueChange={(v) => updateSetting("defaultPlatform", v)}
          >
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={resetSettings}>
          <IconSettings className="mr-1.5 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </section>
  );
}

// ── Prompt Templates ────────────────────────────────────────────

function PromptTemplatesSection() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const activeBrand = useBrandStore((s) =>
    s.brandKits.find((b) => b.id === s.activeBrandId)
  );
  const templates = usePromptTemplateStore((s) => s.templates);
  const loading = usePromptTemplateStore((s) => s.loading);
  const loadTemplates = usePromptTemplateStore((s) => s.loadTemplates);
  const upsertTemplate = usePromptTemplateStore((s) => s.upsertTemplate);
  const deleteTemplate = usePromptTemplateStore((s) => s.deleteTemplate);

  useEffect(() => {
    if (activeBrandId) loadTemplates(activeBrandId);
  }, [activeBrandId, loadTemplates]);

  if (!activeBrandId || !activeBrand) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconPrompt className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Prompt Templates</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a brand first to customize AI prompts.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <IconPrompt className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Prompt Templates</h3>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Customize the AI prompts used across your workflow for{" "}
          <span className="font-medium text-foreground">{activeBrand.name}</span>.
          Use <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{"{{placeholders}}"}</code>{" "}
          to auto-insert brand data.
        </p>
      </div>

      {/* Placeholder reference */}
      <PlaceholderReference />

      <Separator />

      {/* Template editors */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : (
        <div className="space-y-4">
          {PROMPT_TEMPLATE_KEYS.map((meta) => {
            const existing = templates.find(
              (t) => t.brandId === activeBrandId && t.key === meta.key
            );
            return (
              <TemplateEditor
                key={meta.key}
                label={meta.label}
                description={meta.description}
                currentValue={existing?.template ?? ""}
                templateId={existing?.id}
                onSave={(value) =>
                  upsertTemplate(activeBrandId, meta.key, meta.label, value)
                }
                onReset={existing ? () => deleteTemplate(existing.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Template Editor ─────────────────────────────────────────────

function TemplateEditor({
  label,
  description,
  currentValue,
  templateId,
  onSave,
  onReset,
}: {
  label: string;
  description: string;
  currentValue: string;
  templateId?: string;
  onSave: (value: string) => void;
  onReset?: () => void;
}) {
  const [local, setLocal] = useState(currentValue);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync when external value changes
  useEffect(() => {
    setLocal(currentValue);
    setDirty(false);
  }, [currentValue]);

  const handleChange = useCallback(
    (value: string) => {
      setLocal(value);
      setDirty(value !== currentValue);
      setSaved(false);
    },
    [currentValue]
  );

  const handleSave = useCallback(() => {
    onSave(local);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [local, onSave]);

  const handleInsertPlaceholder = useCallback(
    (placeholder: string) => {
      setLocal((prev) => prev + placeholder);
      setDirty(true);
      setSaved(false);
    },
    []
  );

  const hasCustomTemplate = !!templateId;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground">{label}</h4>
            {hasCustomTemplate && (
              <Badge variant="secondary" className="text-[10px]">
                Custom
              </Badge>
            )}
            {!hasCustomTemplate && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Default
              </Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          {saved && (
            <span className="text-[11px] text-green-500 flex items-center gap-0.5">
              <IconCheck className="h-3 w-3" />
              Saved
            </span>
          )}
          {dirty && (
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          )}
          {onReset && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onReset}
              title="Reset to default"
            >
              <IconRotateClockwise className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <Textarea
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Enter your custom ${label.toLowerCase()} prompt template here. Use {{placeholders}} for dynamic content.`}
        className="min-h-[120px] font-mono text-xs leading-relaxed"
        rows={6}
      />

      {/* Quick insert placeholders */}
      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] text-muted-foreground mr-1 self-center">
          Insert:
        </span>
        {AVAILABLE_PLACEHOLDERS.filter(
          (p) =>
            p.source === "brand" &&
            p.placeholder !== "{{brand_vault_full}}"
        )
          .slice(0, 6)
          .map((p) => (
            <button
              key={p.placeholder}
              onClick={() => handleInsertPlaceholder(p.placeholder)}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title={p.description}
            >
              {p.placeholder}
            </button>
          ))}
        <button
          onClick={() => handleInsertPlaceholder("{{brand_vault_full}}")}
          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="All brand vault sections combined"
        >
          {"{{brand_vault_full}}"}
        </button>
      </div>
    </div>
  );
}

// ── Placeholder Reference ───────────────────────────────────────

function PlaceholderReference() {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback((placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedKey(placeholder);
    setTimeout(() => setCopiedKey(null), 1500);
  }, []);

  const grouped = {
    brand: AVAILABLE_PLACEHOLDERS.filter((p) => p.source === "brand"),
    campaign: AVAILABLE_PLACEHOLDERS.filter((p) => p.source === "campaign"),
    frame: AVAILABLE_PLACEHOLDERS.filter((p) => p.source === "frame"),
    platform: AVAILABLE_PLACEHOLDERS.filter((p) => p.source === "platform"),
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(!open)}
      >
        <IconCopy className="h-3.5 w-3.5" />
        {open ? "Hide" : "Show"} Available Placeholders
      </Button>
      {open && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          {(
            [
              { key: "brand", label: "Brand" },
              { key: "campaign", label: "Campaign" },
              { key: "frame", label: "Frame" },
              { key: "platform", label: "Platform" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <div className="grid gap-1">
                {grouped[key].map((p) => (
                  <button
                    key={p.placeholder}
                    onClick={() => handleCopy(p.placeholder)}
                    className="flex items-center gap-3 rounded px-2 py-1 text-left hover:bg-accent transition-colors group"
                  >
                    <code className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[11px] font-mono text-foreground">
                      {p.placeholder}
                    </code>
                    <span className="flex-1 text-[11px] text-muted-foreground truncate">
                      {p.description}
                    </span>
                    {copiedKey === p.placeholder ? (
                      <IconCheck className="h-3 w-3 shrink-0 text-green-500" />
                    ) : (
                      <IconCopy className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
