import "server-only";
import { db } from "@/lib/db";

/** Recompute a provider's rating aggregates from its PUBLISHED reviews. */
export async function recalcProviderRating(providerId: string) {
  const agg = await db.review.aggregate({
    where: { providerId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });
  const ratingCount = agg._count;
  const ratingAvg = ratingCount ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0;
  await db.provider.update({ where: { id: providerId }, data: { ratingAvg, ratingCount } });
  return { ratingAvg, ratingCount };
}
