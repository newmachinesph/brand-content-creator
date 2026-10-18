import {
  IconChevronDown,
  IconCheck,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBrandStore } from "@/stores/brand-store";

interface BrandSwitcherProps {
  onCreateBrand: () => void;
}

export function BrandSwitcher({ onCreateBrand }: BrandSwitcherProps) {
  const brandKits = useBrandStore((s) => s.brandKits);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrand = useBrandStore((s) => s.setActiveBrand);
  const deleteBrandKit = useBrandStore((s) => s.deleteBrandKit);

  const activeBrand = brandKits.find((b) => b.id === activeBrandId);
  if (!activeBrand) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {activeBrand.name}
            </p>
            {activeBrand.description && (
              <p className="truncate text-[11px] text-muted-foreground">
                {activeBrand.description}
              </p>
            )}
          </div>
          <IconChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {brandKits.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => setActiveBrand(brand.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{brand.name}</span>
            {brand.id === activeBrandId && (
              <IconCheck className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateBrand}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Brand
        </DropdownMenuItem>
        {brandKits.length > 1 && (
          <DropdownMenuItem
            onClick={() => deleteBrandKit(activeBrand.id)}
            className="text-destructive focus:text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete "{activeBrand.name}"
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
