import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <IconAlertTriangle className="h-10 w-10 text-destructive/60" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {this.props.moduleName
                ? `${this.props.moduleName} encountered an error`
                : "Something went wrong"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {this.state.error?.message}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <IconRefresh className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
