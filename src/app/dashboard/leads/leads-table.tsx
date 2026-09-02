"use client";

import { useState } from "react";
import { Phone, Mail, MessageSquare, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Lead = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  categorySlug: string | null;
  citySlug: string | null;
};

const STATUSES = ["NEW", "VIEWED", "CONTACTED", "WON", "LOST"] as const;
const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-brand-50 text-brand-700",
  VIEWED: "bg-canvas text-muted",
  CONTACTED: "bg-blue-50 text-blue-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-red-50 text-red-700",
};

export function LeadsTable({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<string>("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);

  const shown = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  async function update(id: string, patch: { status?: string; note?: string }) {
    setSavingId(id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      await fetch(`/api/dashboard/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSavingId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-12 text-center text-sm text-muted">
        No leads yet. As customers post requirements in your category and city, they show up here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {["ALL", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-muted hover:border-brand-300"
            }`}
          >
            {s === "ALL" ? `All (${leads.length})` : `${s} (${leads.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {shown.map((l) => (
          <li key={l.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{l.name}</p>
                <p className="text-xs text-muted">
                  {[l.categorySlug?.replace(/-/g, " "), l.citySlug].filter(Boolean).join(" · ") || "General enquiry"} ·{" "}
                  {timeAgo(new Date(l.createdAt))}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[l.status] ?? "bg-canvas text-muted"}`}>
                {l.status}
              </span>
            </div>

            <p className="mt-2 flex items-start gap-2 text-sm text-ink">
              <MessageSquare size={14} className="mt-0.5 shrink-0 text-muted" />
              {l.message}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700">
                <Phone size={14} /> {l.phone}
              </a>
              {l.email && (
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
                  <Mail size={14} /> {l.email}
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <span className="text-xs font-medium text-muted">Status</span>
              <select
                value={l.status}
                onChange={(e) => update(l.id, { status: e.target.value })}
                className="h-8 rounded-lg border border-line bg-surface px-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                defaultValue={l.note ?? ""}
                placeholder="Add a private note…"
                onBlur={(e) => {
                  if (e.target.value !== (l.note ?? "")) update(l.id, { note: e.target.value });
                }}
                className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-sm"
              />
              {savingId === l.id && <Loader2 size={14} className="animate-spin text-muted" />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
