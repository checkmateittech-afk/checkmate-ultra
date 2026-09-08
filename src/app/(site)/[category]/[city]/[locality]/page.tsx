import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategory,
  getCity,
  getLocality,
  listLocalities,
  searchProviders,
} from "@/lib/queries";
import type { SortValue } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { FiltersBar } from "@/components/site/filters-bar";
import { ProviderCard } from "@/components/site/provider-card";
import { EnquiryForm } from "@/components/site/enquiry-form";

type SP = Promise<{ sort?: string; rating?: string }>;
type PP = Promise<{ category: string; city: string; locality: string }>;

export async function generateMetadata({ params }: { params: PP }): Promise<Metadata> {
  const { category, city, locality } = await params;
  const [cat, c, l] = await Promise.all([
    getCategory(category),
    getCity(city),
    getLocality(city, locality),
  ]);
  if (!cat || !c || !l) return {};
  return {
    title: `${cat.name} in ${l.name}, ${c.name}`,
    description: `Verified ${cat.name.toLowerCase()} providers in ${l.name}, ${c.name}. Compare reviews and pricing, get free quotes.`,
  };
}

export default async function LocalityPage({
  params,
  searchParams,
}: {
  params: PP;
  searchParams: SP;
}) {
  const { category, city, locality } = await params;
  const { sort, rating } = await searchParams;

  const [cat, c, l] = await Promise.all([
    getCategory(category),
    getCity(city),
    getLocality(city, locality),
  ]);
  if (!cat || !c || !l) notFound();

  const [siblings, providers] = await Promise.all([
    listLocalities(c.slug),
    searchProviders({
      categorySlug: cat.slug,
      citySlug: c.slug,
      localitySlug: l.slug,
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
          { label: c.name, href: `/${cat.slug}/${c.slug}` },
          { label: l.name },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {cat.name} in {l.name}, {c.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {providers.length} {cat.name.toLowerCase()} {providers.length === 1 ? "provider" : "providers"} serving {l.name}. Compare ratings and reviews, then get free quotes.
        </p>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <FiltersBar showLocality={false} resultCount={providers.length} />

          <div className="mt-4 grid gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
            {providers.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
                No {cat.name.toLowerCase()} providers listed in {l.name} yet. Post your requirement to
                get matched.
              </div>
            )}
          </div>

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-ink">Nearby localities</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {siblings
                .filter((s) => s.slug !== l.slug)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/${cat.slug}/${c.slug}/${s.slug}`}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-brand-300 hover:text-brand-600"
                  >
                    {s.name}
                  </Link>
                ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Get free quotes</h2>
            <p className="mt-1 text-sm text-muted">
              {cat.name} providers near {l.name} will respond with quotes.
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
