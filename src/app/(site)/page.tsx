import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, Users } from "lucide-react";
import {
  listCategories,
  listCities,
  listLocalities,
  resolveCitySlug,
  featuredProviders,
  getCity,
} from "@/lib/queries";
import { SearchBar } from "@/components/site/search-bar";
import { CategoryGrid } from "@/components/site/category-grid";
import { HowItWorks } from "@/components/site/how-it-works";
import { ProviderCard } from "@/components/site/provider-card";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const citySlug = await resolveCitySlug();
  const [categories, cities, city, localities, featured] = await Promise.all([
    listCategories(),
    listCities(),
    getCity(citySlug),
    listLocalities(citySlug),
    featuredProviders(citySlug, 4),
  ]);

  const cityName = city?.name ?? "your city";
  const popular = categories.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-50 to-canvas">
        <div className="container-page py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Find trusted local experts in {cityName}
            </h1>
            <p className="mt-3 text-base text-muted sm:text-lg">
              Compare {featured.length > 0 ? "verified" : ""} service providers and businesses near
              you. Read real reviews, then get free quotes in minutes.
            </p>

            <div className="mx-auto mt-7 max-w-2xl">
              <SearchBar cities={cities} currentCity={citySlug} variant="hero" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted">Popular:</span>
              {popular.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}/${citySlug}`}
                  className="rounded-full border border-line bg-surface px-3 py-1 font-medium text-ink hover:border-brand-300 hover:text-brand-600"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-500" /> Verified providers
            </span>
            <span className="inline-flex items-center gap-2">
              <Star size={18} className="text-brand-500" /> Genuine reviews only
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={18} className="text-brand-500" /> Free to get quotes
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <SectionHead
          title="Browse by category"
          subtitle={`Top services people are hiring in ${cityName}`}
        />
        <div className="mt-6">
          <CategoryGrid categories={categories} citySlug={citySlug} />
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-12">
        <SectionHead title="How Checkmate works" />
        <div className="mt-6">
          <HowItWorks />
        </div>
      </section>

      {/* Featured providers */}
      {featured.length > 0 && (
        <section className="container-page py-12">
          <SectionHead
            title={`Top rated in ${cityName}`}
            action={{ label: "View all", href: `/search?city=${citySlug}&sort=rating` }}
          />
          <div className="mt-6 grid gap-4">
            {featured.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      )}

      {/* Localities */}
      {localities.length > 0 && (
        <section className="container-page py-12">
          <SectionHead title={`Popular localities in ${cityName}`} />
          <div className="mt-5 flex flex-wrap gap-2">
            {localities.map((l) => (
              <Link
                key={l.slug}
                href={`/${popular[0]?.slug ?? "home-cleaning"}/${citySlug}/${l.slug}`}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-brand-300 hover:text-brand-600"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Business CTA */}
      <section className="container-page pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-navy-800 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Are you a service business?</h3>
            <p className="mt-1 text-sm text-white/70">
              List on Checkmate and get matched with customers looking for exactly what you offer.
            </p>
          </div>
          <Link
            href="/business/join"
            className={buttonVariants({ variant: "primary", size: "lg" }) + " shrink-0"}
          >
            List your business <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          {action.label} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
