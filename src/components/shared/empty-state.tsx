import type { Icon } from "@tabler/icons-react";

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <IconComponent className="h-10 w-10 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
