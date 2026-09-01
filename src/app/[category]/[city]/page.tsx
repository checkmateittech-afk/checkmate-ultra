import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategory,
  getCity,
  listLocalities,
  searchProviders,
} from "@/lib/queries";
import type { SortValue } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { FiltersBar } from "@/components/site/filters-bar";
import { ProviderCard } from "@/components/site/provider-card";
import { EnquiryForm } from "@/components/site/enquiry-form";

type SP = Promise<{ sort?: string; rating?: string; locality?: string }>;
type PP = Promise<{ category: string; city: string }>;

export async function generateMetadata({ params }: { params: PP }): Promise<Metadata> {
  const { category, city } = await params;
  const [cat, c] = await Promise.all([getCategory(category), getCity(city)]);
  if (!cat || !c) return {};
  return {
    title: `${cat.name} in ${c.name}`,
    description: `Compare verified ${cat.name.toLowerCase()} providers in ${c.name}. Ratings, reviews and pricing — send a free enquiry to get quotes.`,
  };
}

export default async function CategoryCityPage({
  params,
  searchParams,
}: {
  params: PP;
  searchParams: SP;
}) {
  const { category, city } = await params;
  const { sort, rating, locality } = await searchParams;

  const [cat, c] = await Promise.all([getCategory(category), getCity(city)]);
  if (!cat || !c) notFound();

  const [localities, providers] = await Promise.all([
    listLocalities(c.slug),
    searchProviders({
      categorySlug: cat.slug,
      citySlug: c.slug,
      localitySlug: locality,
      sort: (sort as SortValue) ?? "recommended",
      minRating: rating ? Number(rating) : 0,
    }),
  ]);

  return (
    <div className="container-page py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: cat.name, href: `/${cat.slug}` },
          { label: c.name },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {cat.name} in {c.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {providers.length > 0 ? (
            <>
              Compare {providers.length} {cat.name.toLowerCase()} {providers.length === 1 ? "provider" : "providers"} across{" "}
              {c.name}. Check genuine ratings and reviews, see indicative pricing, and send one free
              enquiry to receive quotes.
            </>
          ) : (
            <>We&apos;re still adding {cat.name.toLowerCase()} providers in {c.name}. Post your requirement and we&apos;ll match you.</>
          )}
        </p>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <FiltersBar localities={localities} resultCount={providers.length} />

          <div className="mt-4 grid gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
            {providers.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
                No providers match these filters. Try clearing the rating or locality filter.
              </div>
            )}
          </div>

          {localities.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold text-ink">
                {cat.name} by locality in {c.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {localities.map((l) => (
                  <Link
                    key={l.slug}
                    href={`/${cat.slug}/${c.slug}/${l.slug}`}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-brand-300 hover:text-brand-600"
                  >
                    {cat.name} in {l.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Get free quotes</h2>
            <p className="mt-1 text-sm text-muted">
              One form. Multiple {cat.name.toLowerCase()} providers in {c.name} respond.
            </p>
            <div className="mt-4">
              <EnquiryForm categorySlug={cat.slug} citySlug={c.slug} compact />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
