"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

type City = {
  slug: string;
  name: string;
  state: string;
  providers: number;
  localities: { id: string; name: string; slug: string; providers: number }[];
};

export function LocalityManager({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [data, setData] = useState(cities);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function addLocality(citySlug: string) {
    const name = (drafts[citySlug] ?? "").trim();
    if (name.length < 2) return;
    setBusy(citySlug);
    setErr(null);
    try {
      const res = await fetch("/api/admin/localities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citySlug, name }),
      });
      const j = await res.json();
      if (res.ok) {
        setData((cs) =>
          cs.map((c) =>
            c.slug === citySlug
              ? { ...c, localities: [...c.localities, { ...j.locality, providers: 0 }].sort((a, b) => a.name.localeCompare(b.name)) }
              : c,
          ),
        );
        setDrafts((d) => ({ ...d, [citySlug]: "" }));
        router.refresh();
      } else {
        setErr(j.error ?? "Could not add locality");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="divide-y divide-line">
      {err && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}
      {data.map((c) => (
        <div key={c.slug} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">
                {c.name} <span className="text-xs font-normal text-muted">· {c.state}</span>
              </p>
              <p className="text-xs text-muted">
                {c.providers} providers · {c.localities.length} localities
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.localities.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink"
              >
                {l.name}
                <span className="text-muted">{l.providers}</span>
              </span>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={drafts[c.slug] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.slug]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addLocality(c.slug)}
              placeholder="Add a locality…"
              className="h-8 w-48 rounded-lg border border-line bg-surface px-2.5 text-sm"
            />
            <button
              onClick={() => addLocality(c.slug)}
              disabled={busy === c.slug || (drafts[c.slug] ?? "").trim().length < 2}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-canvas disabled:opacity-40"
            >
              {busy === c.slug ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
