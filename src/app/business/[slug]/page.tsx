import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Briefcase, Phone, Mail } from "lucide-react";
import { getProvider, ratingBreakdown } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { categoryIcon } from "@/lib/catalog";
import { gradientFromSeed, formatPrice, timeAgo, initials } from "@/lib/utils";
import { Avatar } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PhoneReveal } from "@/components/site/phone-reveal";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { ReviewForm } from "@/components/site/review-form";

type PP = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: PP }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) return {};
  const cat = p.services[0]?.category.name ?? "Local services";
  return {
    title: `${p.name} — ${cat} in ${p.locality.name}, ${p.city.name}`,
    description: `${p.name}: ${p.ratingAvg.toFixed(1)}★ from ${p.ratingCount} reviews. ${p.about.slice(0, 120)}`,
  };
}

export default async function ProviderPage({ params }: { params: PP }) {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) notFound();

  const primaryCat = p.services[0]?.category;
  const breakdown = ratingBreakdown(p.reviews);

  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === p.ownerId;
  const alreadyReviewed = viewer
    ? (await db.review.count({ where: { providerId: p.id, userId: viewer.id } })) > 0
    : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.name,
    description: p.about,
    address: {
      "@type": "PostalAddress",
      streetAddress: p.addressLine,
      addressLocality: p.locality.name,
      addressRegion: p.city.state,
      addressCountry: "IN",
    },
    telephone: p.phone,
    aggregateRating:
      p.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: p.ratingAvg,
            reviewCount: p.ratingCount,
          }
        : undefined,
  };

  return (
    <div className="container-page py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(primaryCat ? [{ label: primaryCat.name, href: `/${primaryCat.slug}` }] : []),
          { label: p.city.name, href: primaryCat ? `/${primaryCat.slug}/${p.city.slug}` : "/" },
          { label: p.name },
        ]}
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Header */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="h-24 bg-gradient-to-r from-brand-500 to-navy-700" />
            <div className="flex flex-col gap-4 p-5 sm:flex-row">
              <div className="-mt-12 shrink-0">
                <Avatar
                  name={p.name}
                  gradient={gradientFromSeed(p.slug)}
                  size={84}
                  className="ring-4 ring-surface"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-ink">{p.name}</h1>
                  {p.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      <BadgeCheck size={13} /> Verified
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {p.ratingAvg.toFixed(1)} ★
                  </span>
                  <RatingStars value={p.ratingAvg} size={15} />
                  <span className="text-muted">{p.ratingCount} reviews</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {p.addressLine}, {p.locality.name}, {p.city.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase size={14} /> {p.yearsInBusiness}{" "}
                    {p.yearsInBusiness === 1 ? "yr" : "yrs"} in business
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.services.map((s) => (
                    <span
                      key={s.category.slug}
                      className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted"
                    >
                      {s.category.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PhoneReveal phone={p.phone} size="md" />
                  <Link
                    href="#enquiry"
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Send Enquiry
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          {p.photos.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold text-ink">Work samples</h2>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {p.photos.map((ph) => {
                  const Icon = categoryIcon(primaryCat?.icon ?? "Wrench");
                  return (
                    <div
                      key={ph.id}
                      className="flex h-32 w-44 shrink-0 flex-col items-center justify-center gap-2 rounded-xl text-white"
                      style={{ backgroundImage: gradientFromSeed(ph.tint + ph.id) }}
                    >
                      <Icon size={28} />
                      <span className="px-3 text-center text-xs opacity-90">{ph.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* About */}
          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">About {p.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.about}</p>
          </section>

          {/* Services & pricing */}
          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Services &amp; indicative pricing</h2>
            <ul className="mt-3 divide-y divide-line">
              {p.services.map((s) => {
                const Icon = categoryIcon(s.category.icon);
                return (
                  <li key={s.category.slug} className="flex items-center gap-3 py-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon size={18} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{s.category.name}</span>
                    <span className="text-sm font-semibold text-ink">
                      {formatPrice(s.priceFrom, s.priceUnit)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Pricing is indicative. Send an enquiry for a quote specific to your job.
            </p>
          </section>

          {/* Reviews */}
          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Ratings &amp; reviews</h2>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-ink">{p.ratingAvg.toFixed(1)}</div>
                <RatingStars value={p.ratingAvg} size={16} className="mt-1 justify-center" />
                <div className="mt-1 text-xs text-muted">{p.ratingCount} reviews</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {breakdown.map((b) => (
                  <div key={b.star} className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-8">{b.star} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                      <span
                        className="block h-full rounded-full bg-star"
                        style={{ width: `${b.pct}%` }}
                      />
                    </span>
                    <span className="w-8 text-right">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              {isOwner ? (
                <p className="text-sm text-muted">You can reply to reviews from your dashboard.</p>
              ) : !viewer ? (
                <p className="text-sm text-muted">
                  <Link href={`/login?next=/business/${p.slug}`} className="font-medium text-brand-600 hover:text-brand-700">
                    Sign in
                  </Link>{" "}
                  to write a review.
                </p>
              ) : alreadyReviewed ? (
                <p className="text-sm text-muted">Thanks — you&apos;ve already reviewed this business.</p>
              ) : (
                <ReviewForm providerId={p.id} providerName={p.name} />
              )}
            </div>

            <ul className="mt-6 divide-y divide-line">
              {p.reviews.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundImage: gradientFromSeed(r.authorName) }}
                    >
                      {initials(r.authorName)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-ink">{r.authorName}</div>
                      <div className="flex items-center gap-2">
                        <RatingStars value={r.rating} size={12} />
                        <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{r.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{r.body}</p>
                  {r.providerReply && (
                    <div className="mt-2 rounded-lg border-l-2 border-brand-300 bg-canvas p-3">
                      <p className="text-xs font-semibold text-ink">Response from {p.name}</p>
                      <p className="mt-0.5 text-sm text-muted">{r.providerReply}</p>
                    </div>
                  )}
                </li>
              ))}
              {p.reviews.length === 0 && (
                <li className="py-6 text-sm text-muted">No reviews yet. Be the first to review {p.name}.</li>
              )}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div id="enquiry" className="scroll-mt-24 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Contact {p.name}</h2>
            <div className="mt-4">
              <EnquiryForm
                providerId={p.id}
                providerName={p.name}
                categorySlug={primaryCat?.slug}
                citySlug={p.city.slug}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-5 text-sm">
            <h3 className="font-semibold text-ink">Business details</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-ink/70">Address</dt>
                <dd>{p.addressLine}, {p.locality.name}, {p.city.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-ink/70">Experience</dt>
                <dd>
                  {p.yearsInBusiness} {p.yearsInBusiness === 1 ? "year" : "years"}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-24 shrink-0 text-ink/70"><Phone size={13} className="inline" /> Phone</dt>
                <dd><PhoneReveal phone={p.phone} /></dd>
              </div>
              {p.email && (
                <div className="flex items-center gap-2">
                  <dt className="w-24 shrink-0 text-ink/70"><Mail size={13} className="inline" /> Email</dt>
                  <dd className="break-all">{p.email}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
