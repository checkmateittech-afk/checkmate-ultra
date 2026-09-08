"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

type Cat = { id: string; name: string; slug: string; blurb: string; leadPrice: number; providers: number };

export function CategoryEditor({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(categories);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(categories.map((c) => [c.id, String(c.leadPrice)])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save(id: string) {
    const value = Number(drafts[id]);
    if (!value || value === rows.find((r) => r.id === id)?.leadPrice) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadPrice: value }),
      });
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, leadPrice: value } : r)));
        setSavedId(id);
        setTimeout(() => setSavedId(null), 1500);
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-medium">Category</th>
            <th className="px-4 py-2.5 text-right font-medium">Providers</th>
            <th className="px-4 py-2.5 font-medium">Lead price (credits)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-2.5">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.blurb}</p>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted">{c.providers}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={drafts[c.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [c.id]: e.target.value.replace(/[^0-9]/g, "") }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && save(c.id)}
                    className="h-8 w-20 rounded-lg border border-line bg-surface px-2 text-sm tabular-nums"
                  />
                  <button
                    onClick={() => save(c.id)}
                    disabled={busyId === c.id || Number(drafts[c.id]) === c.leadPrice || !Number(drafts[c.id])}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-canvas disabled:opacity-40"
                  >
                    {busyId === c.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : savedId === c.id ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : null}
                    {savedId === c.id ? "Saved" : "Save"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
