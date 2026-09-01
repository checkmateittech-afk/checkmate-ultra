import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-line" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-brand-600">
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
