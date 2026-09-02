import type { Metadata } from "next";
import { adminListReviews } from "@/lib/queries";
import { ReviewsModeration } from "./reviews-moderation";

export const metadata: Metadata = { title: "Admin · Reviews" };

export default async function AdminReviews({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const reviews = await adminListReviews(status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Hidden reviews are removed from public pages and rating averages.
        </p>
      </div>
      <ReviewsModeration
        activeStatus={status ?? ""}
        reviews={reviews.map((r) => ({
          id: r.id,
          providerName: r.provider.name,
          providerSlug: r.provider.slug,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
