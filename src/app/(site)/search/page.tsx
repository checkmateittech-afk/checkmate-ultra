import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getCity,
  listCategories,
  listLocalities,
  resolveCitySlug,
  searchProviders,
} from "@/lib/queries";
import type { SortValue } from "@/lib/catalog";
import { FiltersBar } from "@/components/site/filters-bar";
import { ProviderCard } from "@/components/site/provider-card";
import { EnquiryForm } from "@/components/site/enquiry-form";

type SP = Promise<{
  q?: string;
  city?: string;
  locality?: string;
  sort?: string;
  rating?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search local services" };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const citySlug = sp.city ?? (await resolveCitySlug());

  const [city, categories, localities, providers] = await Promise.all([
    getCity(citySlug),
    listCategories(),
    listLocalities(citySlug),
    searchProviders({
      q,
      citySlug,
      localitySlug: sp.locality,
      sort: (sp.sort as SortValue) ?? "recommended",
      minRating: sp.rating ? Number(sp.rating) : 0,
    }),
  ]);

  const cityName = city?.name ?? citySlug;
  const matchedCategory = q
    ? categories.find(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          q.toLowerCase().includes(c.name.toLowerCase().split(" ")[0]),
      )
    : undefined;

  return (
    <div className="container-page py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : <>All services</>} in {cityName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {providers.length} {providers.length === 1 ? "provider" : "providers"} found.
        </p>
      </header>

      {matchedCategory && (
        <Link
          href={`/${matchedCategory.slug}/${citySlug}`}
          className="mt-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm hover:border-brand-300"
        >
          <span>
            Looking for <span className="font-semibold text-brand-700">{matchedCategory.name}</span>?
            See the dedicated {matchedCategory.name.toLowerCase()} page for {cityName}.
          </span>
          <ArrowRight size={16} className="shrink-0 text-brand-600" />
        </Link>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <FiltersBar localities={localities} resultCount={providers.length} />
          <div className="mt-4 grid gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
            {providers.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
                <p className="text-sm text-muted">
                  No providers matched {q ? `“${q}”` : "your filters"} in {cityName}.
                </p>
                <p className="mt-1 text-sm text-muted">
                  Post your requirement below and we&apos;ll match you with providers.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Not finding the right fit?</h2>
            <p className="mt-1 text-sm text-muted">
              Describe what you need and get free quotes from providers in {cityName}.
            </p>
            <div className="mt-4">
              <EnquiryForm categorySlug={matchedCategory?.slug} citySlug={citySlug} compact />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
