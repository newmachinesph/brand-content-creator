import {
  IconLayoutDashboard,
  IconCalendar,
  IconBook,
  IconBrain,
  IconMessageChatbot,
  IconFlag,
  IconLayoutBoard,
  IconPhoto,
  IconTemplate,
  IconDevices,
  IconPackageExport,
  IconChartBar,
  IconBrush,
  IconTimeline,
  IconSettings,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import type { ModuleId } from "@/types/common";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_GROUPS: { items: NavItem[] }[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", icon: IconLayoutDashboard },
      { id: "calendar", label: "Calendar", icon: IconCalendar },
    ],
  },
  {
    items: [
      { id: "brand-vault", label: "Brand Vault", icon: IconBook },
      { id: "brand-memory", label: "Brand Memory", icon: IconBrain },
      { id: "brand-chat", label: "Brand Chat", icon: IconMessageChatbot },
    ],
  },
  {
    items: [
      { id: "campaigns", label: "Campaigns", icon: IconFlag },
      { id: "storyboards", label: "Storyboards", icon: IconLayoutBoard },
    ],
  },
  {
    items: [
      { id: "assets", label: "Assets", icon: IconPhoto },
      { id: "templates", label: "Templates", icon: IconTemplate },
      { id: "design-studio", label: "Design Studio", icon: IconBrush },
    ],
  },
  {
    items: [
      { id: "platform-specs", label: "Platform Specs", icon: IconDevices },
    ],
  },
  {
    items: [
      { id: "export", label: "Export", icon: IconPackageExport },
      { id: "reporting", label: "Reporting", icon: IconChartBar },
      { id: "activity-log", label: "Activity", icon: IconTimeline },
    ],
  },
];

const BOTTOM_ITEM: NavItem = {
  id: "settings",
  label: "Settings",
  icon: IconSettings,
};

function RailButton({ item }: { item: NavItem }) {
  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const isActive = activeModule === item.id;
  const Icon = item.icon;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={() => setActiveModule(item.id)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function RailNav() {
  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar pt-10 pb-2">
      <div className="flex flex-1 flex-col items-center gap-0.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col items-center gap-0.5">
            {gi > 0 && (
              <Separator className="my-1.5 w-6 bg-sidebar-border" />
            )}
            {group.items.map((item) => (
              <RailButton key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      <Separator className="my-1.5 w-6 bg-sidebar-border" />
      <RailButton item={BOTTOM_ITEM} />
    </div>
  );
}
