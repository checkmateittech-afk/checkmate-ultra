"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ providerId, providerName }: { providerId: string; providerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 size={16} /> Thanks for reviewing {providerName}!
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Star size={15} className="text-star" /> Write a review
      </Button>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          rating,
          title: String(fd.get("title") ?? ""),
          body: String(fd.get("body") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Could not submit review");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">Your rating</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                size={26}
                className={cn(
                  "transition",
                  (hover || rating) >= n ? "fill-star text-star" : "text-line",
                )}
              />
            </button>
          ))}
        </div>
        {fieldErrors.rating && <span className="mt-1 block text-xs text-red-600">{fieldErrors.rating}</span>}
      </div>
      <Field label="Headline" error={fieldErrors.title}>
        <Input name="title" placeholder="e.g. Prompt and professional" required />
      </Field>
      <Field label="Your review" error={fieldErrors.body}>
        <Textarea name="body" placeholder="Share your experience to help others decide." required />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          Submit review
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
