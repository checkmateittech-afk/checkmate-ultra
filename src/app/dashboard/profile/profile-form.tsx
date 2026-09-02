"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Initial = {
  about: string;
  phone: string;
  email: string;
  yearsInBusiness: string;
  addressLine: string;
  localitySlug: string;
};

export function ProviderProfileForm({
  initial,
  localities,
  cityName,
  primaryService,
}: {
  initial: Initial;
  localities: { slug: string; name: string }[];
  cityName: string;
  primaryService: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Initial, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, yearsInBusiness: Number(form.yearsInBusiness) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Could not save");
        setState("error");
        return;
      }
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setError("Network error");
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="rounded-lg bg-canvas p-3 text-xs text-muted">
        Primary service <span className="font-medium text-ink">{primaryService}</span> · City{" "}
        <span className="font-medium text-ink">{cityName}</span>. Changing your primary service or
        city will be available in a later update.
      </div>

      <Field label="About" error={fieldErrors.about}>
        <Textarea value={form.about} onChange={(e) => set("about", e.target.value)} className="min-h-28" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact phone" error={fieldErrors.phone}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Contact email" error={fieldErrors.email}>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Years in business" error={fieldErrors.yearsInBusiness}>
          <Input
            value={form.yearsInBusiness}
            onChange={(e) => set("yearsInBusiness", e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
          />
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
        <Input value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <Button type="submit" disabled={!dirty || state === "saving"}>
          {state === "saving" && <Loader2 size={16} className="animate-spin" />}
          {state === "saved" && <Check size={16} />}
          {state === "saved" ? "Saved" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
