"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, Plus, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };
type Faq = { q: string; a: string };

export type CourseInitial = {
  id: string;
  slug: string;
  status: string;
  title: string;
  subtitle: string;
  categoryId: string;
  summary: string;
  overview: string;
  mode: string;
  level: string;
  durationText: string;
  feeText: string;
  trainerName: string;
  highlights: string;
  curriculum: string;
  prerequisites: string;
  audience: string;
  faq: Faq[];
  heroTint: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
};

const TINTS = ["1f3a5f", "0f766e", "7c3aed", "b45309", "be123c", "1d4ed8", "047857", "9333ea"];
const EMPTY: Omit<CourseInitial, "id" | "slug" | "status"> = {
  title: "",
  subtitle: "",
  categoryId: "",
  summary: "",
  overview: "",
  mode: "ONLINE",
  level: "",
  durationText: "",
  feeText: "",
  trainerName: "",
  highlights: "",
  curriculum: "",
  prerequisites: "",
  audience: "",
  faq: [],
  heroTint: "1f3a5f",
  metaTitle: "",
  metaDescription: "",
  ogImageUrl: "",
};

export function CourseForm({
  categories: initialCategories,
  initial,
}: {
  categories: Category[];
  initial?: CourseInitial;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState({ ...EMPTY, ...(initial ?? {}), categoryId: initial?.categoryId ?? initialCategories[0]?.id ?? "" });
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [busy, setBusy] = useState<null | "save" | "publish" | "unpublish">(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [newCat, setNewCat] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function addCategory() {
    if (newCat.trim().length < 2) return;
    const res = await fetch("/api/admin/course-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((c) => [...c, data.category]);
      set("categoryId", data.category.id);
      setNewCat("");
    } else {
      setError(data.error ?? "Could not add category");
    }
  }

  function payload(nextStatus?: string) {
    return {
      ...form,
      faq: form.faq.filter((f) => f.q.trim() && f.a.trim()),
      status: nextStatus ?? status,
    };
  }

  async function submit(intent: "save" | "publish" | "unpublish") {
    setBusy(intent);
    setError(null);
    setFieldErrors({});
    setSaved(false);
    const nextStatus = intent === "publish" ? "PUBLISHED" : intent === "unpublish" ? "DRAFT" : status;

    try {
      const url = editing ? `/api/admin/courses/${initial!.id}` : "/api/admin/courses";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(nextStatus)),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Could not save");
        return;
      }
      if (!editing) {
        router.replace(`/admin/courses/${data.course.id}`);
        router.refresh();
        return;
      }
      setStatus(data.course.status);
      setSlug(data.course.slug);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> All courses
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : status === "ARCHIVED" ? "bg-canvas text-muted" : "bg-amber-50 text-amber-700",
            )}
          >
            {status}
          </span>
          {editing && status === "PUBLISHED" && (
            <Link href={`/courses/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
              View live <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <Section title="Basics">
            <Field label="Course title" error={fieldErrors.title}>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Business Analyst Training" />
            </Field>
            <Field label="Subtitle" hint="One line under the title.">
              <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Instructor-led, job-ready in 10 weeks" />
            </Field>
            <Field label="Category" error={fieldErrors.categoryId}>
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="…or add a new category" className="h-9 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <Field label="Summary" error={fieldErrors.summary} hint="Shown on cards and used for the meta description if you leave SEO blank.">
              <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} className="min-h-20" />
            </Field>
          </Section>

          <Section title="Overview">
            <Field label="Full description" error={fieldErrors.overview} hint="Plain text or simple markdown. This is the main body of the page.">
              <Textarea value={form.overview} onChange={(e) => set("overview", e.target.value)} className="min-h-48" />
            </Field>
          </Section>

          <Section title="What you'll learn & curriculum">
            <Field label="Highlights" hint="One per line.">
              <Textarea
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
                placeholder={"Real-world case studies\nResume & interview prep\nCertificate on completion"}
                className="min-h-28"
              />
            </Field>
            <Field label="Curriculum / modules" hint="One module per line.">
              <Textarea
                value={form.curriculum}
                onChange={(e) => set("curriculum", e.target.value)}
                placeholder={"Introduction & fundamentals\nRequirements gathering\nProcess modelling (BPMN)\nAgile & Scrum"}
                className="min-h-32"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Who it's for">
                <Textarea value={form.audience} onChange={(e) => set("audience", e.target.value)} className="min-h-20" />
              </Field>
              <Field label="Prerequisites">
                <Textarea value={form.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} className="min-h-20" />
              </Field>
            </div>
          </Section>

          <Section title="FAQs" hint="Rendered on the page and as FAQ schema for search engines.">
            <div className="flex flex-col gap-3">
              {form.faq.map((f, i) => (
                <div key={i} className="rounded-lg border border-line p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={f.q}
                      onChange={(e) => set("faq", form.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                      placeholder="Question"
                      className="h-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => set("faq", form.faq.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-lg border border-line p-2 text-muted hover:bg-canvas"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Textarea
                    value={f.a}
                    onChange={(e) => set("faq", form.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                    placeholder="Answer"
                    className="mt-2 min-h-16"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("faq", [...form.faq, { q: "", a: "" }])}>
                <Plus size={14} /> Add FAQ
              </Button>
            </div>
          </Section>

          <Section title="SEO">
            <Field label="Meta title" hint={`${form.metaTitle.length}/70 — defaults to the course title`}>
              <Input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={70} />
            </Field>
            <Field label="Meta description" error={fieldErrors.metaDescription} hint={`${form.metaDescription.length}/180 — defaults to the summary`}>
              <Textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} maxLength={180} className="min-h-16" />
            </Field>
            <Field label="Social image URL" error={fieldErrors.ogImageUrl} hint="Optional. Used for OG/Twitter cards.">
              <Input value={form.ogImageUrl} onChange={(e) => set("ogImageUrl", e.target.value)} placeholder="https://…" />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Section title="Details">
            <Field label="Mode">
              <Select value={form.mode} onChange={(e) => set("mode", e.target.value)}>
                <option value="ONLINE">Live online</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </Field>
            <Field label="Level">
              <Input value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="Beginner / Intermediate" />
            </Field>
            <Field label="Duration">
              <Input value={form.durationText} onChange={(e) => set("durationText", e.target.value)} placeholder="10 weeks · 40 hrs" />
            </Field>
            <Field label="Fee">
              <Input value={form.feeText} onChange={(e) => set("feeText", e.target.value)} placeholder="₹25,000 or Free" />
            </Field>
            <Field label="Trainer">
              <Input value={form.trainerName} onChange={(e) => set("trainerName", e.target.value)} placeholder="Name / team" />
            </Field>
          </Section>

          <Section title="Hero colour">
            <div className="flex flex-wrap gap-2">
              {TINTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("heroTint", t)}
                  className={cn("h-8 w-8 rounded-lg border-2", form.heroTint === t ? "border-ink" : "border-transparent")}
                  style={{ backgroundColor: `#${t}` }}
                  aria-label={`#${t}`}
                />
              ))}
            </div>
          </Section>

          <div className="rounded-xl border border-line bg-surface p-4">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            {saved && (
              <p className="mb-2 inline-flex items-center gap-1 text-sm text-emerald-700">
                <Check size={14} /> Saved
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => submit("save")} disabled={busy !== null} className="w-full">
                {busy === "save" && <Loader2 size={15} className="animate-spin" />}
                {editing ? "Save changes" : "Create draft"}
              </Button>
              {status !== "PUBLISHED" ? (
                <Button type="button" variant="navy" onClick={() => submit("publish")} disabled={busy !== null} className="w-full">
                  {busy === "publish" && <Loader2 size={15} className="animate-spin" />}
                  {editing ? "Publish" : "Create & publish"}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => submit("unpublish")} disabled={busy !== null} className="w-full">
                  {busy === "unpublish" && <Loader2 size={15} className="animate-spin" />}
                  Unpublish
                </Button>
              )}
            </div>
            {slug && <p className="mt-2 text-center text-xs text-muted">URL: /courses/{slug}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}
