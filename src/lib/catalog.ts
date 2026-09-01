import {
  Truck,
  Sparkles,
  Plug,
  Wrench,
  PaintRoller,
  Bug,
  Wind,
  Ruler,
  GraduationCap,
  Activity,
  Camera,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** Maps the `icon` key stored on Category rows to a Lucide component. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Truck,
  Sparkles,
  Plug,
  Wrench,
  PaintRoller,
  Bug,
  Wind,
  Ruler,
  GraduationCap,
  Activity,
  Camera,
  UtensilsCrossed,
};

export function categoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? Wrench;
}

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating: high to low" },
  { value: "reviews", label: "Most reviewed" },
  { value: "newest", label: "Newest" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const RATING_FILTERS = [
  { value: "0", label: "Any rating" },
  { value: "3", label: "3.0+" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" },
] as const;

export const DEFAULT_CITY_SLUG = "bengaluru";
export const CITY_COOKIE = "ck_city";
