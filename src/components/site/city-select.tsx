"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { CITY_COOKIE } from "@/lib/catalog";

type City = { slug: string; name: string };

export function CitySelect({ cities, current }: { cities: City[]; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(slug: string) {
    document.cookie = `${CITY_COOKIE}=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 text-sm font-medium">
      <MapPin size={16} className="text-brand-500" />
      <select
        aria-label="Select your city"
        value={current}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-4 font-semibold text-ink focus-visible:outline-none disabled:opacity-60"
      >
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-0 text-muted" />
    </div>
  );
}
