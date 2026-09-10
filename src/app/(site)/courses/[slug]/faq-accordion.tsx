"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((f, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-ink">{f.q}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-muted transition ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
