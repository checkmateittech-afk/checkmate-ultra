import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider, getOwnerReviews } from "@/lib/queries";
import { OwnerReviews } from "./owner-reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function DashboardReviews() {
  const user = (await getCurrentUser())!;
  const provider = (await getOwnedProvider(user.id))!;
  const reviews = await getOwnerReviews(provider.id);

  const published = reviews.filter((r) => r.status === "PUBLISHED");
  const avg = published.length
    ? Math.round((published.reduce((s, r) => s + r.rating, 0) / published.length) * 10) / 10
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          {published.length
            ? `${avg.toFixed(1)} average from ${published.length} published ${published.length === 1 ? "review" : "reviews"}.`
            : "No published reviews yet."}{" "}
          Replying shows a public response on your profile.
        </p>
      </div>

      <OwnerReviews
        reviews={reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          providerReply: r.providerReply,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
