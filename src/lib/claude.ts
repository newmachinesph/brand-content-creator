import { invoke, Channel } from "@tauri-apps/api/core";

export interface ClaudeStreamEvent {
  type: "started" | "stdout" | "stderr" | "close" | "error";
  content: string;
  exitCode?: number;
}

export interface ClaudeChild {
  pid: number | null;
  kill: () => Promise<void>;
}

interface RustStreamEvent {
  eventType: string;
  content: string;
  exitCode?: number;
}

export async function spawnClaude(
  prompt: string,
  onEvent: (event: ClaudeStreamEvent) => void
): Promise<ClaudeChild> {
  const child: ClaudeChild = {
    pid: null,
    kill: async () => {
      if (child.pid) {
        try {
          await invoke("stop_generation", { pid: child.pid });
        } catch (e) {
          console.warn("Failed to stop generation:", e);
        }
      }
    },
  };

  const channel = new Channel<RustStreamEvent>();
  channel.onmessage = (event: RustStreamEvent) => {
    if (event.eventType === "started") {
      child.pid = parseInt(event.content, 10) || null;
      return;
    }
    if (event.eventType === "stdout") {
      onEvent({ type: "stdout", content: event.content + "\n" });
    } else if (event.eventType === "stderr") {
      onEvent({ type: "stderr", content: event.content });
    } else if (event.eventType === "close") {
      onEvent({
        type: "close",
        content: "",
        exitCode: event.exitCode,
      });
    }
  };

  // invoke is async — resolves when process finishes, rejects if spawn fails
  invoke("generate_content", { prompt, onEvent: channel }).catch((err) => {
    onEvent({ type: "error", content: String(err) });
  });

  // Small delay so the "started" event with PID arrives
  await new Promise((r) => setTimeout(r, 100));

  return child;
}
