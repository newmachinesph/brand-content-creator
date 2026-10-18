import { useState, useRef, useCallback } from "react";
import { Editor, defaultValueCtx, rootCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { nord } from "@milkdown/theme-nord";
import { callCommand, replaceAll } from "@milkdown/utils";
import { Milkdown, MilkdownProvider, useEditor, useInstance } from "@milkdown/react";
import "prosemirror-tables/style/tables.css";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm";
import {
  IconBold,
  IconItalic,
  IconCode,
  IconStrikethrough,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconQuote,
  IconTerminal2,
  IconMinus,
  IconTable,
  IconEye,
  IconSourceCode,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ─── Toolbar ────────────────────────────────────────────────────

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ToolbarSep() {
  return <div className="mx-0.5 h-4 w-px bg-border" />;
}

/** WYSIWYG formatting toolbar — must be inside MilkdownProvider */
function WysiwygToolbar() {
  const [loading, getEditor] = useInstance();

  const exec = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cmd: Parameters<typeof callCommand>[0], payload?: any) => {
      if (loading) return;
      const editor = getEditor();
      editor?.action(callCommand(cmd, payload));
    },
    [loading, getEditor],
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton icon={IconBold} label="Bold (Ctrl+B)" onClick={() => exec(toggleStrongCommand.key)} />
      <ToolbarButton icon={IconItalic} label="Italic (Ctrl+I)" onClick={() => exec(toggleEmphasisCommand.key)} />
      <ToolbarButton icon={IconStrikethrough} label="Strikethrough" onClick={() => exec(toggleStrikethroughCommand.key)} />
      <ToolbarButton icon={IconCode} label="Inline Code (Ctrl+E)" onClick={() => exec(toggleInlineCodeCommand.key)} />
      <ToolbarSep />
      <ToolbarButton icon={IconH1} label="Heading 1" onClick={() => exec(wrapInHeadingCommand.key, 1)} />
      <ToolbarButton icon={IconH2} label="Heading 2" onClick={() => exec(wrapInHeadingCommand.key, 2)} />
      <ToolbarButton icon={IconH3} label="Heading 3" onClick={() => exec(wrapInHeadingCommand.key, 3)} />
      <ToolbarSep />
      <ToolbarButton icon={IconList} label="Bullet List" onClick={() => exec(wrapInBulletListCommand.key)} />
      <ToolbarButton icon={IconListNumbers} label="Ordered List" onClick={() => exec(wrapInOrderedListCommand.key)} />
      <ToolbarButton icon={IconQuote} label="Blockquote" onClick={() => exec(wrapInBlockquoteCommand.key)} />
      <ToolbarSep />
      <ToolbarButton icon={IconTable} label="Insert Table" onClick={() => exec(insertTableCommand.key)} />
      <ToolbarButton icon={IconTerminal2} label="Code Block" onClick={() => exec(createCodeBlockCommand.key)} />
      <ToolbarButton icon={IconMinus} label="Horizontal Rule" onClick={() => exec(insertHrCommand.key)} />
    </div>
  );
}

// ─── Inner editor (must be inside MilkdownProvider) ─────────────

function MilkdownEditor({
  defaultValue,
  onChange,
  onReady,
}: {
  defaultValue: string;
  onChange: (markdown: string) => void;
  onReady?: (editor: Editor) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEditor((root) => {
    const editor = Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, defaultValue);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onChangeRef.current(markdown);
          }
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(listener);

    if (onReady) {
      editor.create().then((e) => onReady(e));
    }

    return editor;
  }, []);

  return <Milkdown />;
}

// ─── Public component ───────────────────────────────────────────

interface MarkdownEditorProps {
  defaultValue: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({
  defaultValue,
  onChange,
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"wysiwyg" | "code">("wysiwyg");
  const [codeValue, setCodeValue] = useState(defaultValue);
  const editorRef = useRef<Editor | null>(null);
  const prevDefaultValueRef = useRef(defaultValue);
  const latestMarkdown = useRef(defaultValue);

  // If defaultValue changes externally (section switch), replace content
  if (defaultValue !== prevDefaultValueRef.current) {
    prevDefaultValueRef.current = defaultValue;
    latestMarkdown.current = defaultValue;
    setCodeValue(defaultValue);
    if (editorRef.current) {
      editorRef.current.action(replaceAll(defaultValue));
    }
  }

  function handleToggleMode() {
    if (mode === "wysiwyg") {
      // Switching to code — seed textarea with latest markdown
      setCodeValue(latestMarkdown.current);
      setMode("code");
    } else {
      // Switching back to WYSIWYG — editor will remount with latestMarkdown
      latestMarkdown.current = codeValue;
      onChange(codeValue);
      setMode("wysiwyg");
    }
  }

  function handleWysiwygChange(markdown: string) {
    latestMarkdown.current = markdown;
    onChange(markdown);
  }

  function handleCodeChange(val: string) {
    setCodeValue(val);
    latestMarkdown.current = val;
    onChange(val);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card", className)}>
      {mode === "wysiwyg" ? (
        <MilkdownProvider>
          {/* Toolbar + toggle in same provider so useInstance() works */}
          <div className="flex shrink-0 items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1">
            <WysiwygToolbar />
            <div className="ml-auto">
              <ToolbarButton
                icon={IconSourceCode}
                label="Switch to Code"
                onClick={handleToggleMode}
              />
            </div>
          </div>
          <div className="milkdown-wrapper min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <MilkdownEditor
              defaultValue={latestMarkdown.current}
              onChange={handleWysiwygChange}
              onReady={(e) => {
                editorRef.current = e;
                prevDefaultValueRef.current = defaultValue;
              }}
            />
          </div>
        </MilkdownProvider>
      ) : (
        <>
          {/* Code mode — no MilkdownProvider needed */}
          <div className="flex shrink-0 items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1">
            <span className="px-1 text-xs text-muted-foreground">Markdown</span>
            <div className="ml-auto">
              <ToolbarButton
                icon={IconEye}
                label="Switch to Preview"
                onClick={handleToggleMode}
                active
              />
            </div>
          </div>
          <textarea
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-card px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none"
          />
        </>
      )}
    </div>
  );
}
