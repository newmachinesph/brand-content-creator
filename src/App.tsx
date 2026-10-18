import { useEffect, Component, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { useBrandStore } from "@/stores/brand-store";
import { useTheme } from "@/hooks/use-theme";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#ef4444" }}>
          <h1>Runtime Error</h1>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, opacity: 0.7 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const loadFromDb = useBrandStore((s) => s.loadFromDb);
  useTheme();

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  return (
    <ErrorBoundary>
      <AppShell />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </ErrorBoundary>
  );
}
