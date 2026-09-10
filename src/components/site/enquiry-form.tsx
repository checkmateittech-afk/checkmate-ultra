"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EnquiryForm({
  providerId,
  providerName,
  categorySlug,
  citySlug,
  compact = false,
  subject,
  ctaLabel,
}: {
  providerId?: string;
  providerName?: string;
  categorySlug?: string;
  citySlug?: string;
  compact?: boolean;
  /** Overrides the intro copy and prefilled message — used by course pages. */
  subject?: string;
  ctaLabel?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      message: String(fd.get("message") ?? ""),
      providerId,
      categorySlug,
      citySlug,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setState(data.fieldErrors ? "idle" : "error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="text-emerald-600" size={32} />
        <p className="font-semibold text-emerald-800">{subject ? "Enquiry sent!" : "Requirement sent!"}</p>
        <p className="text-sm text-emerald-700">
          {subject
            ? "Our team will get in touch shortly with batch dates and fees."
            : `${providerName ? `${providerName} and other matching providers` : "Matching providers"} will contact you shortly with quotes.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {!compact && (
        <p className="text-sm text-muted">
          {subject ? (
            <>
              Ask about <span className="font-medium text-ink">{subject}</span> — batch dates, fees and
              curriculum.
            </>
          ) : (
            <>
              Tell us what you need and get free quotes from{" "}
              {providerName ? <span className="font-medium text-ink">{providerName}</span> : "verified local providers"}.
            </>
          )}
        </p>
      )}
      <Field label="Your name" error={errors.name}>
        <Input name="name" placeholder="e.g. Anita Rao" autoComplete="name" required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone" error={errors.phone}>
          <Input name="phone" placeholder="10-digit mobile" inputMode="tel" autoComplete="tel" required />
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <Input name="email" placeholder="you@example.com" type="email" autoComplete="email" />
        </Field>
      </div>
      <Field label={subject ? "Your question" : "What do you need?"} error={errors.message}>
        <Textarea
          name="message"
          placeholder={subject ? "I'd like to know the next batch date and fees…" : "Describe the job, timeline and location…"}
          defaultValue={
            subject
              ? `I'm interested in ${subject}. Please share the upcoming batch dates and fees.`
              : categorySlug
                ? `Looking for ${categorySlug.replace(/-/g, " ")}` + (citySlug ? ` in ${citySlug}.` : ".")
                : ""
          }
          required
        />
      </Field>
      {state === "error" && <p className="text-sm text-red-600">{message}</p>}
      <Button type="submit" disabled={state === "loading"} className="w-full">
        {state === "loading" && <Loader2 size={16} className="animate-spin" />}
        {state === "loading" ? "Sending…" : (ctaLabel ?? "Get free quotes")}
      </Button>
      <p className="text-center text-xs text-muted">
        By submitting you agree to be contacted by providers. No spam.
      </p>
    </form>
  );
}
