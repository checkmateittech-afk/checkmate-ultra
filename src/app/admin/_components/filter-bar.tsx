"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, X } from "lucide-react";

type SelectFilter = { key: string; label: string; options: { value: string; label: string }[] };

export function FilterBar({
  searchKey = "q",
  searchPlaceholder = "Search…",
  selects = [],
  hideSearch = false,
}: {
  searchKey?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  hideSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get(searchKey) ?? "");

  useEffect(() => {
    setQ(params.get(searchKey) ?? "");
  }, [params, searchKey]);

  function apply(next: URLSearchParams) {
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam(searchKey, q.trim());
  }

  const hasFilters = (!hideSearch && q) || selects.some((s) => params.get(s.key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hideSearch && (
        <form onSubmit={submitSearch} className="relative flex-1 sm:min-w-64 sm:flex-none">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted/70 focus-visible:border-brand-400 focus-visible:outline-none"
          />
        </form>
      )}

      {selects.map((s) => (
        <select
          key={s.key}
          aria-label={s.label}
          value={params.get(s.key) ?? ""}
          onChange={(e) => setParam(s.key, e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink focus-visible:outline-none"
        >
          <option value="">{s.label}: all</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {hasFilters && (
        <button
          type="button"
          onClick={() => apply(new URLSearchParams())}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-2.5 text-sm text-muted hover:bg-canvas"
        >
          <X size={14} /> Clear
        </button>
      )}
      {pending && <span className="text-xs text-muted">…</span>}
    </div>
  );
}
