import { useState, useRef, useCallback } from "react";
import { spawnClaude, type ClaudeChild } from "@/lib/claude";
import { toast } from "sonner";

interface UseGenerationOptions {
  onComplete?: (content: string, prompt: string) => void;
  onError?: (error: string) => void;
}

interface UseGenerationReturn {
  isGenerating: boolean;
  streamOutput: string;
  generate: (prompt: string) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
}

export function useGeneration(
  options: UseGenerationOptions = {}
): UseGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const childRef = useRef<ClaudeChild | null>(null);
  const accumulatedRef = useRef("");
  const promptRef = useRef("");

  const generate = useCallback(
    async (prompt: string) => {
      setStreamOutput("");
      setIsGenerating(true);
      accumulatedRef.current = "";
      promptRef.current = prompt;

      try {
        const child = await spawnClaude(prompt, (event) => {
          if (event.type === "stdout") {
            accumulatedRef.current += event.content;
            setStreamOutput((prev) => prev + event.content);
          } else if (event.type === "stderr") {
            console.warn("[claude stderr]", event.content);
          } else if (event.type === "close") {
            const finalContent = accumulatedRef.current.trim();
            if (event.exitCode === 0 && finalContent) {
              options.onComplete?.(finalContent, promptRef.current);
              toast.success("Content generated");
            } else if (event.exitCode !== 0) {
              const errMsg = `Claude exited with code ${event.exitCode}`;
              options.onError?.(errMsg);
              toast.error(errMsg);
            }
            setIsGenerating(false);
            childRef.current = null;
          } else if (event.type === "error") {
            options.onError?.(event.content);
            toast.error(`Error: ${event.content}`);
            setIsGenerating(false);
            childRef.current = null;
          }
        });
        childRef.current = child;
      } catch (err) {
        console.error("Failed to spawn Claude:", err);
        setIsGenerating(false);
        toast.error("Failed to start Claude CLI. Is it installed?");
      }
    },
    [options.onComplete, options.onError]
  );

  const stop = useCallback(async () => {
    if (childRef.current) {
      await childRef.current.kill();
      childRef.current = null;
      setIsGenerating(false);
      toast("Generation stopped");
    }
  }, []);

  const clear = useCallback(() => {
    setStreamOutput("");
  }, []);

  return { isGenerating, streamOutput, generate, stop, clear };
}
