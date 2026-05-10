import {
  Coffee,
  Droplets,
  Milk,
  Package2,
  Soup,
  UtensilsCrossed,
  Wheat,
  Box,
  Apple,
  Cookie,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Coffee,
  Droplets,
  Milk,
  Package2,
  Soup,
  UtensilsCrossed,
  Wheat,
  Box,
  Apple,
  Cookie,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(ICONS);

export function resolveCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Package2;
  return ICONS[name] ?? Package2;
}
