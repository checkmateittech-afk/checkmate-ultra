"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Upload, Trash2, ImageIcon, Megaphone } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SiteSettingsData } from "@/lib/settings";

const COLOR_PRESETS = ["f2620f", "1f3a5f", "0f766e", "7c3aed", "b45309", "be123c", "1d4ed8", "047857"];

export function SettingsForm({ settings }: { settings: SiteSettingsData }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl);
  const [form, setForm] = useState({
    siteName: settings.siteName,
    tagline: settings.tagline ?? "",
    supportEmail: settings.supportEmail ?? "",
    supportPhone: settings.supportPhone ?? "",
    primaryColor: settings.primaryColor ?? "f2620f",
    announcementText: settings.announcementText ?? "",
    announcementActive: settings.announcementActive,
  });

  const [savingText, setSavingText] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  const logoInput = useRef<HTMLInputElement>(null);
  const faviconInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function upload(kind: "logo" | "favicon", file: File) {
    setUploading(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/settings/logo?type=${kind}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      if (kind === "logo") setLogoUrl(data.url);
      else setFaviconUrl(data.url);
      router.refresh();
    } finally {
      setUploading(null);
    }
  }

  async function remove(kind: "logo" | "favicon") {
    setUploading(kind);
    setError(null);
    try {
      const res = await fetch(`/api/admin/settings/logo?type=${kind}`, { method: "DELETE" });
      if (res.ok) {
        if (kind === "logo") setLogoUrl(null);
        else setFaviconUrl(null);
        router.refresh();
      }
    } finally {
      setUploading(null);
    }
  }

  async function saveText(e: React.FormEvent) {
    e.preventDefault();
    setSavingText(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSavingText(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <Check size={14} /> Saved. Some changes (logo, colour) apply on next page load.
        </p>
      )}

      {/* Branding */}
      <section>
        <h2 className="text-sm font-bold text-ink">Branding</h2>
        <p className="mt-0.5 text-xs text-muted">Shown in the header, footer and admin sidebar across the whole platform.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <UploadTile
            label="Logo"
            hint="Square works best. PNG, JPG, WebP or SVG, up to 2MB."
            url={logoUrl}
            busy={uploading === "logo"}
            inputRef={logoInput}
            onPick={(f) => upload("logo", f)}
            onRemove={() => remove("logo")}
          />
          <UploadTile
            label="Favicon"
            hint="Small square icon for the browser tab. Up to 2MB."
            url={faviconUrl}
            busy={uploading === "favicon"}
            inputRef={faviconInput}
            onPick={(f) => upload("favicon", f)}
            onRemove={() => remove("favicon")}
            small
          />
        </div>
      </section>

      <form onSubmit={saveText} className="flex flex-col gap-6">
        {/* Identity */}
        <section>
          <h2 className="text-sm font-bold text-ink">Platform identity</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Platform name">
              <Input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} maxLength={60} />
            </Field>
            <Field label="Tagline" hint="Optional, shown in some page headers.">
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={140} />
            </Field>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-sm font-bold text-ink">Support contact</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Support email">
              <Input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@example.com" />
            </Field>
            <Field label="Support phone">
              <Input value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} placeholder="+91 …" />
            </Field>
          </div>
        </section>

        {/* Brand color */}
        <section>
          <h2 className="text-sm font-bold text-ink">Brand colour</h2>
          <p className="mt-0.5 text-xs text-muted">Re-themes buttons, links and accents everywhere.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("primaryColor", c)}
                className={cn(
                  "h-8 w-8 rounded-lg border-2",
                  form.primaryColor.toLowerCase() === c ? "border-ink" : "border-transparent",
                )}
                style={{ backgroundColor: `#${c}` }}
                aria-label={`#${c}`}
              />
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
              <span className="h-5 w-5 shrink-0 rounded-md border border-line" style={{ backgroundColor: `#${form.primaryColor}` }} />
              <span className="text-sm text-muted">#</span>
              <input
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
                className="w-20 bg-transparent text-sm uppercase tabular-nums focus-visible:outline-none"
                placeholder="F2620F"
              />
            </div>
          </div>
        </section>

        {/* Announcement */}
        <section>
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Megaphone size={14} /> Announcement banner
          </h2>
          <p className="mt-0.5 text-xs text-muted">Shows in a bar at the top of every public page while active.</p>
          <div className="mt-3 flex flex-col gap-3">
            <Textarea
              value={form.announcementText}
              onChange={(e) => set("announcementText", e.target.value)}
              placeholder="e.g. New: Data & Analytics batch starts 1 October — enrol now."
              maxLength={200}
              className="min-h-16"
            />
            <label className="flex w-fit items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.announcementActive}
                onChange={(e) => set("announcementActive", e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand-500"
              />
              Show the banner on the live site
            </label>
            {form.announcementActive && form.announcementText.trim() && (
              <div className="rounded-lg bg-navy-800 px-3 py-2 text-center text-sm text-white">
                {form.announcementText}
              </div>
            )}
          </div>
        </section>

        <div>
          <Button type="submit" disabled={savingText}>
            {savingText && <Loader2 size={15} className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

function UploadTile({
  label,
  hint,
  url,
  busy,
  small,
  inputRef,
  onPick,
  onRemove,
}: {
  label: string;
  hint: string;
  url: string | null;
  busy: boolean;
  small?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-canvas",
            small ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon size={18} className="text-muted" />
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {url ? "Replace" : "Upload"}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
              <Trash2 size={13} /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
