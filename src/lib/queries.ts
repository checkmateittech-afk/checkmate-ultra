import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { CITY_COOKIE, DEFAULT_CITY_SLUG, type SortValue } from "@/lib/catalog";
import type { Prisma } from "@prisma/client";

export async function listCategories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getCategory(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function listCities() {
  return db.city.findMany({ orderBy: { name: "asc" } });
}

export async function getCity(slug: string) {
  return db.city.findUnique({ where: { slug } });
}

export async function listLocalities(citySlug: string) {
  const city = await db.city.findUnique({
    where: { slug: citySlug },
    include: { localities: { orderBy: { name: "asc" } } },
  });
  return city?.localities ?? [];
}

export async function getLocality(citySlug: string, localitySlug: string) {
  const city = await db.city.findUnique({ where: { slug: citySlug } });
  if (!city) return null;
  return db.locality.findUnique({
    where: { cityId_slug: { cityId: city.id, slug: localitySlug } },
  });
}

/** Selected city from cookie, falling back to the default. Guaranteed to resolve to a real row. */
export async function resolveCitySlug(): Promise<string> {
  const jar = await cookies();
  const fromCookie = jar.get(CITY_COOKIE)?.value;
  if (fromCookie) {
    const exists = await db.city.findUnique({ where: { slug: fromCookie }, select: { slug: true } });
    if (exists) return exists.slug;
  }
  return DEFAULT_CITY_SLUG;
}

export type ProviderSearch = {
  q?: string;
  categorySlug?: string;
  citySlug?: string;
  localitySlug?: string;
  sort?: SortValue;
  minRating?: number;
  take?: number;
};

const providerCardSelect = {
  id: true,
  slug: true,
  name: true,
  about: true,
  phone: true,
  verified: true,
  yearsInBusiness: true,
  ratingAvg: true,
  ratingCount: true,
  city: { select: { name: true, slug: true } },
  locality: { select: { name: true, slug: true } },
  services: {
    select: { priceFrom: true, priceUnit: true, category: { select: { name: true, slug: true, icon: true } } },
  },
} satisfies Prisma.ProviderSelect;

export type ProviderCardData = Prisma.ProviderGetPayload<{ select: typeof providerCardSelect }>;

function orderBy(sort: SortValue | undefined): Prisma.ProviderOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "reviews":
      return [{ ratingCount: "desc" }, { ratingAvg: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ verified: "desc" }, { ratingAvg: "desc" }, { ratingCount: "desc" }];
  }
}

export async function searchProviders(params: ProviderSearch): Promise<ProviderCardData[]> {
  const { q, categorySlug, citySlug, localitySlug, sort, minRating, take = 40 } = params;

  const and: Prisma.ProviderWhereInput[] = [{ status: "ACTIVE" }];
  if (citySlug) and.push({ city: { slug: citySlug } });
  if (localitySlug) and.push({ locality: { slug: localitySlug } });
  if (categorySlug) and.push({ services: { some: { category: { slug: categorySlug } } } });
  if (minRating && minRating > 0) and.push({ ratingAvg: { gte: minRating } });
  if (q && q.trim()) {
    const term = q.trim();
    and.push({
      OR: [
        { name: { contains: term } },
        { about: { contains: term } },
        { locality: { name: { contains: term } } },
        { services: { some: { category: { name: { contains: term } } } } },
      ],
    });
  }

  return db.provider.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: orderBy(sort),
    take,
    select: providerCardSelect,
  });
}

export async function countProviders(params: Omit<ProviderSearch, "sort" | "take">) {
  const rows = await searchProviders({ ...params, take: 1000 });
  return rows.length;
}

export async function featuredProviders(citySlug: string, take = 6) {
  return db.provider.findMany({
    where: { status: "ACTIVE", city: { slug: citySlug } },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take,
    select: providerCardSelect,
  });
}

export async function getProvider(slug: string) {
  return db.provider.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      city: true,
      locality: true,
      photos: { orderBy: { sortOrder: "asc" } },
      services: { include: { category: true } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type ProviderDetail = NonNullable<Awaited<ReturnType<typeof getProvider>>>;

/** The provider owned by a user (any status) — for the dashboard. */
export async function getOwnedProvider(userId: string) {
  return db.provider.findUnique({
    where: { ownerId: userId },
    include: {
      city: true,
      locality: true,
      services: { include: { category: true } },
      kycSubmissions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getProviderLeads(providerId: string) {
  return db.lead.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    include: { leadRequest: true },
  });
}

export async function providerDashboardStats(providerId: string) {
  const [total, fresh, won, provider] = await Promise.all([
    db.lead.count({ where: { providerId } }),
    db.lead.count({ where: { providerId, status: "NEW" } }),
    db.lead.count({ where: { providerId, status: "WON" } }),
    db.provider.findUnique({
      where: { id: providerId },
      select: { ratingAvg: true, ratingCount: true, status: true, kycStatus: true, verified: true },
    }),
  ]);
  return { total, fresh, won, provider };
}

export function ratingBreakdown(reviews: { rating: number }[]) {
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;
  return buckets.map((b) => ({ ...b, pct: Math.round((b.count / total) * 100) }));
}
