"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type City = { slug: string; name: string };

export function SearchBar({
  cities,
  currentCity,
  variant = "hero",
  defaultQuery = "",
}: {
  cities: City[];
  currentCity: string;
  variant?: "hero" | "compact";
  defaultQuery?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [city, setCity] = useState(currentCity);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("city", city);
    router.push(`/search?${params.toString()}`);
  }

  const hero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex w-full items-stretch gap-2 rounded-xl border border-line bg-surface",
        hero ? "flex-col p-2 shadow-lg sm:flex-row sm:items-center" : "h-11",
      )}
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search size={hero ? 20 : 16} className="shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a service, e.g. packers and movers"
          className={cn(
            "w-full bg-transparent text-ink placeholder:text-muted/70 focus-visible:outline-none",
            hero ? "h-11 text-base" : "h-full text-sm",
          )}
        />
      </div>
      <div
        className={cn(
          "flex items-center gap-2",
          hero ? "border-t border-line pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-2" : "border-l border-line pl-2",
        )}
      >
        <select
          aria-label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={cn(
            "cursor-pointer appearance-none bg-transparent px-2 font-medium text-ink focus-visible:outline-none",
            hero ? "h-11 text-sm" : "h-full text-sm",
          )}
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 font-semibold text-white hover:bg-brand-600",
            hero ? "h-11 px-6 text-sm" : "h-full px-4 text-sm",
          )}
        >
          <Search size={16} />
          <span className={hero ? "" : "hidden sm:inline"}>Search</span>
        </button>
      </div>
    </form>
  );
}
