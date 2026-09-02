"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { timeAgo } from "@/lib/utils";

type Row = {
  id: string;
  providerName: string;
  providerSlug: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

const FILTERS = ["", "PUBLISHED", "HIDDEN", "PENDING"];

export function ReviewsModeration({ reviews, activeStatus }: { reviews: Row[]; activeStatus: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(reviews);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f || "all"}
            href={`/admin/reviews${f ? `?status=${f}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              activeStatus === f ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-muted hover:border-brand-300"
            }`}
          >
            {f || "All"}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
          No reviews match this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <RatingStars value={r.rating} size={13} />
                    <span className="text-sm font-medium text-ink">{r.authorName}</span>
                    <span className="text-xs text-muted">on</span>
                    <Link href={`/business/${r.providerSlug}`} target="_blank" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                      {r.providerName}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink">{r.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-muted">{r.status}</span>
                  <span className="text-muted">{timeAgo(new Date(r.createdAt))}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted">{r.body}</p>
              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                {r.status !== "HIDDEN" ? (
                  <button
                    onClick={() => setStatus(r.id, "HIDDEN")}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(r.id, "PUBLISHED")}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Publish
                  </button>
                )}
                {busyId === r.id && <Loader2 size={14} className="animate-spin text-muted" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
