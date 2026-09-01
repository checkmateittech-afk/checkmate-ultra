"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, RATING_FILTERS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Locality = { slug: string; name: string };

export function FiltersBar({
  localities,
  showLocality = true,
  resultCount,
}: {
  localities?: Locality[];
  showLocality?: boolean;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = params.get("sort") ?? "recommended";
  const rating = params.get("rating") ?? "0";
  const locality = params.get("locality") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "0") next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-line bg-surface p-3">
      <span className="text-sm font-medium text-muted">
        {resultCount.toLocaleString("en-IN")} {resultCount === 1 ? "result" : "results"}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          {RATING_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => setParam("rating", r.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                rating === r.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line bg-surface text-muted hover:border-brand-300",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {showLocality && localities && localities.length > 0 && (
          <select
            aria-label="Locality"
            value={locality}
            onChange={(e) => setParam("locality", e.target.value)}
            className="h-9 appearance-none rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-ink"
          >
            <option value="">All localities</option>
            {localities.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="h-9 appearance-none rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-ink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
