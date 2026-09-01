import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryIcon } from "@/lib/catalog";

type Category = { slug: string; name: string; icon: string; blurb: string };

export function CategoryGrid({
  categories,
  citySlug,
}: {
  categories: Category[];
  citySlug?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const Icon = categoryIcon(c.icon);
        const href = citySlug ? `/${c.slug}/${citySlug}` : `/${c.slug}`;
        return (
          <Link
            key={c.slug}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-brand-300 hover:shadow-sm"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
              <Icon size={22} />
            </span>
            <span className="font-semibold text-ink">{c.name}</span>
            <span className="line-clamp-2 text-xs text-muted">{c.blurb}</span>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Explore
              <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
