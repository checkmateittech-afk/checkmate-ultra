import { NextResponse } from "next/server";
import { z } from "zod";
import { searchProviders } from "@/lib/queries";

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  sort: z.enum(["recommended", "rating", "reviews", "newest"]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  take: z.coerce.number().min(1).max(60).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { q, category, city, locality, sort, minRating, take } = parsed.data;
  const providers = await searchProviders({
    q,
    categorySlug: category,
    citySlug: city,
    localitySlug: locality,
    sort,
    minRating,
    take,
  });
  return NextResponse.json({ count: providers.length, providers });
}
