"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { Pill } from "../_components/admin-ui";
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
  providerReply: string | null;
  createdAt: string;
};

export function ReviewsModeration({ reviews }: { reviews: Row[] }) {
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

  if (rows.length === 0) return <p className="p-10 text-center text-sm text-muted">No reviews match these filters.</p>;

  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id} className="px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars value={r.rating} size={13} />
                <span className="text-sm font-medium text-ink">{r.authorName}</span>
                <span className="text-xs text-muted">on</span>
                <Link
                  href={`/business/${r.providerSlug}`}
                  target="_blank"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {r.providerName} <ExternalLink size={10} />
                </Link>
                <Pill>{r.status}</Pill>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">{r.title}</p>
              <p className="mt-0.5 text-sm text-muted">{r.body}</p>
              {r.providerReply && (
                <p className="mt-1.5 border-l-2 border-brand-300 pl-2 text-xs text-muted">
                  <span className="font-semibold text-ink">Reply:</span> {r.providerReply}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted">{timeAgo(new Date(r.createdAt))}</span>
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
              {busyId === r.id && <Loader2 size={13} className="animate-spin text-muted" />}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
