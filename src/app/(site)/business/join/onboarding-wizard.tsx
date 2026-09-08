"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Cat = { slug: string; name: string };
type City = { slug: string; name: string; localities: { slug: string; name: string }[] };

const STEPS = ["Business", "Service & location", "Review"] as const;

export function OnboardingWizard({
  categories,
  cities,
  defaultName,
  defaultPhone,
}: {
  categories: Cat[];
  cities: City[];
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: defaultName,
    about: "",
    phone: defaultPhone,
    email: "",
    yearsInBusiness: "1",
    categorySlug: categories[0]?.slug ?? "",
    citySlug: cities[0]?.slug ?? "",
    localitySlug: cities[0]?.localities[0]?.slug ?? "",
    addressLine: "",
    priceFrom: "",
    priceUnit: "per visit",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const localities = cities.find((c) => c.slug === form.citySlug)?.localities ?? [];

  function next() {
    setError(null);
    if (step === 0) {
      const e: Record<string, string> = {};
      if (form.name.trim().length < 2) e.name = "Enter your business name";
      if (form.about.trim().length < 30) e.about = "Add at least 30 characters";
      if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Enter a valid phone number";
      setFieldErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 1) {
      const e: Record<string, string> = {};
      if (!form.categorySlug) e.categorySlug = "Choose a service";
      if (!form.localitySlug) e.localitySlug = "Choose a locality";
      if (form.addressLine.trim().length < 4) e.addressLine = "Enter your address";
      setFieldErrors(e);
      if (Object.keys(e).length) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsInBusiness: Number(form.yearsInBusiness),
          priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Could not create your listing");
        if (data.fieldErrors) setStep(data.fieldErrors.name || data.fieldErrors.about || data.fieldErrors.phone ? 0 : 1);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <ol className="mb-6 flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? "bg-emerald-600 text-white" : i === step ? "bg-brand-500 text-white" : "bg-canvas text-muted"
              }`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </span>
            <span className={i === step ? "font-semibold text-ink" : "text-muted"}>{label}</span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-line" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Field label="Business name" error={fieldErrors.name}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Prime Home Care" />
          </Field>
          <Field label="About your business" error={fieldErrors.about} hint="What you do, your experience, service area.">
            <Textarea value={form.about} onChange={(e) => set("about", e.target.value)} className="min-h-28" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact phone" error={fieldErrors.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
            </Field>
            <Field label="Contact email (optional)">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
            </Field>
          </div>
          <Field label="Years in business">
            <Input
              value={form.yearsInBusiness}
              onChange={(e) => set("yearsInBusiness", e.target.value.replace(/\D/g, "").slice(0, 3))}
              inputMode="numeric"
              className="max-w-32"
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <Field label="Primary service" error={fieldErrors.categorySlug}>
            <Select value={form.categorySlug} onChange={(e) => set("categorySlug", e.target.value)}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Select
                value={form.citySlug}
                onChange={(e) => {
                  const city = cities.find((c) => c.slug === e.target.value);
                  setForm((f) => ({ ...f, citySlug: e.target.value, localitySlug: city?.localities[0]?.slug ?? "" }));
                }}
              >
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Locality" error={fieldErrors.localitySlug}>
              <Select value={form.localitySlug} onChange={(e) => set("localitySlug", e.target.value)}>
                {localities.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Address" error={fieldErrors.addressLine}>
            <Input value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Shop / building, street" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starting price (optional)" hint="Indicative — shown on your profile.">
              <Input
                value={form.priceFrom}
                onChange={(e) => set("priceFrom", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="e.g. 1500"
              />
            </Field>
            <Field label="Price unit">
              <Select value={form.priceUnit} onChange={(e) => set("priceUnit", e.target.value)}>
                {["per visit", "per hour", "per sq ft", "per room", "per event", "project onwards"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3 text-sm">
          <Review label="Business" value={form.name} />
          <Review label="About" value={form.about} />
          <Review label="Phone" value={form.phone} />
          {form.email && <Review label="Email" value={form.email} />}
          <Review label="Experience" value={`${form.yearsInBusiness} years`} />
          <Review label="Service" value={categories.find((c) => c.slug === form.categorySlug)?.name ?? ""} />
          <Review
            label="Location"
            value={`${localities.find((l) => l.slug === form.localitySlug)?.name ?? ""}, ${
              cities.find((c) => c.slug === form.citySlug)?.name ?? ""
            } — ${form.addressLine}`}
          />
          {form.priceFrom && <Review label="Pricing" value={`From ₹${form.priceFrom} ${form.priceUnit}`} />}
          <p className="mt-2 rounded-lg bg-canvas p-3 text-xs text-muted">
            Your listing goes live immediately. Verify your business later from the dashboard to earn a
            &ldquo;Verified&rdquo; badge.
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
        >
          <ChevronLeft size={16} /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue <ChevronRight size={16} />
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Creating…" : "Create listing"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-line pb-2">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
