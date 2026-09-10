import type { Metadata } from "next";
import { requireFullStaff } from "@/lib/admin-guard";
import { adminReviews } from "@/lib/admin";
import { PageHeader, Panel } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";
import { ReviewsModeration } from "./reviews-moderation";

export const metadata: Metadata = { title: "Admin · Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; rating?: string }>;
}) {
  await requireFullStaff();
  const sp = await searchParams;
  const reviews = await adminReviews(sp);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reviews"
        description="Hidden reviews are removed from public pages and excluded from rating averages."
      />

      <FilterBar
        searchPlaceholder="Search title, body, author…"
        selects={[
          { key: "status", label: "Status", options: ["PUBLISHED", "HIDDEN", "PENDING"].map((v) => ({ value: v, label: v })) },
          { key: "rating", label: "Rating", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}★` })) },
        ]}
      />

      <Panel bodyClassName="p-0">
        <ReviewsModeration
          reviews={reviews.map((r) => ({
            id: r.id,
            providerName: r.provider.name,
            providerSlug: r.provider.slug,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            status: r.status,
            providerReply: r.providerReply,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </Panel>
    </div>
  );
}
