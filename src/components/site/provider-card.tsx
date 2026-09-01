import Link from "next/link";
import { BadgeCheck, MapPin, Briefcase } from "lucide-react";
import type { ProviderCardData } from "@/lib/queries";
import { gradientFromSeed, formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { PhoneReveal } from "./phone-reveal";
import { buttonVariants } from "@/components/ui/button";

export function ProviderCard({ provider }: { provider: ProviderCardData }) {
  const primary = provider.services[0];
  const href = `/business/${provider.slug}`;

  return (
    <article className="rounded-xl border border-line bg-surface p-4 transition hover:border-brand-300 hover:shadow-sm sm:p-5">
      <div className="flex gap-4">
        <Avatar name={provider.name} gradient={gradientFromSeed(provider.slug)} size={56} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <Link href={href} className="text-lg font-semibold text-ink hover:text-brand-600">
              {provider.name}
            </Link>
            {provider.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {provider.ratingAvg.toFixed(1)}
              </span>
              <RatingStars value={provider.ratingAvg} size={14} />
              <span className="text-muted">
                {provider.ratingCount.toLocaleString("en-IN")} reviews
              </span>
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {provider.locality.name}, {provider.city.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase size={14} /> {provider.yearsInBusiness}{" "}
              {provider.yearsInBusiness === 1 ? "yr" : "yrs"} in business
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {provider.services.map((s) => (
              <span
                key={s.category.slug}
                className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted"
              >
                {s.category.name}
              </span>
            ))}
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-muted">{provider.about}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {primary && (
              <span className="text-sm font-semibold text-ink">
                {formatPrice(primary.priceFrom, primary.priceUnit)}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <PhoneReveal phone={provider.phone} />
              <Link
                href={`${href}#enquiry`}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Send Enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
