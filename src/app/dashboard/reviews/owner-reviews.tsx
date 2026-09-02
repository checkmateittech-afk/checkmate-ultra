"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  providerReply: string | null;
  createdAt: string;
};

export function OwnerReviews({ reviews: initial }: { reviews: Review[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-12 text-center text-sm text-muted">
        No reviews yet. Ask happy customers to leave one from your public page.
      </div>
    );
  }

  async function sendReply(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: draft }),
      });
      if (res.ok) {
        setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, providerReply: draft } : r)));
        setReplyingId(null);
        setDraft("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <RatingStars value={r.rating} size={13} />
                <span className="text-sm font-medium text-ink">{r.authorName}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">{r.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {r.status !== "PUBLISHED" && (
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">{r.status}</span>
              )}
              <span className="text-xs text-muted">{timeAgo(new Date(r.createdAt))}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted">{r.body}</p>

          {r.providerReply ? (
            <div className="mt-3 rounded-lg border-l-2 border-brand-300 bg-canvas p-3">
              <p className="text-xs font-semibold text-ink">Your response</p>
              <p className="mt-0.5 text-sm text-muted">{r.providerReply}</p>
            </div>
          ) : replyingId === r.id ? (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a public response…"
                className="min-h-16"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={() => sendReply(r.id)} disabled={busy || draft.trim().length < 2}>
                  {busy && <Loader2 size={14} className="animate-spin" />} Post reply
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setReplyingId(null); setDraft(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setReplyingId(r.id); setDraft(""); }}
              className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Reply publicly
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
