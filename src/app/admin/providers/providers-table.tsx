"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, BadgeCheck } from "lucide-react";

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  kycStatus: string;
  verified: boolean;
  tier: string;
  balance: number;
  city: string;
  locality: string;
  category: string;
  ownerPhone: string | null;
  lastKyc: { docType: string; docRef: string } | null;
};

const FILTERS = [
  { label: "All", status: "", kyc: "" },
  { label: "KYC submitted", status: "", kyc: "SUBMITTED" },
  { label: "Pending", status: "PENDING", kyc: "" },
  { label: "Suspended", status: "SUSPENDED", kyc: "" },
];

export function ProvidersTable({
  providers,
  activeStatus,
  activeKyc,
}: {
  providers: Row[];
  activeStatus: string;
  activeKyc: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(providers);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, patch: { status?: string; kycDecision?: string }) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setRows((rs) =>
          rs.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: patch.status ?? r.status,
                  kycStatus: patch.kycDecision ?? r.kycStatus,
                  verified: patch.kycDecision === "VERIFIED" ? true : patch.kycDecision === "REJECTED" ? false : r.verified,
                }
              : r,
          ),
        );
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function grant(id: string, amount: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/providers/${id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, balance: data.balance } : r)));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = activeStatus === f.status && activeKyc === f.kyc;
          const qs = new URLSearchParams();
          if (f.status) qs.set("status", f.status);
          if (f.kyc) qs.set("kyc", f.kyc);
          return (
            <Link
              key={f.label}
              href={`/admin/providers${qs.toString() ? `?${qs}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-muted hover:border-brand-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
          No providers match this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/business/${r.slug}`} target="_blank" className="font-semibold text-ink hover:text-brand-600">
                    {r.name}
                  </Link>
                  {r.verified && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    {r.category} · {r.locality}, {r.city}
                    {r.ownerPhone ? ` · owner ${r.ownerPhone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-muted">status: {r.status}</span>
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-muted">kyc: {r.kycStatus}</span>
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-muted">{r.tier}</span>
                  <span className="rounded-full bg-canvas px-2 py-0.5 font-medium text-ink">{r.balance} cr</span>
                </div>
              </div>

              {r.lastKyc && (
                <p className="mt-2 text-xs text-muted">
                  Submitted document: <span className="font-medium text-ink">{r.lastKyc.docType}</span> · {r.lastKyc.docRef}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {r.kycStatus === "SUBMITTED" && (
                  <>
                    <button
                      onClick={() => act(r.id, { kycDecision: "VERIFIED" })}
                      disabled={busyId === r.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={() => act(r.id, { kycDecision: "REJECTED" })}
                      disabled={busyId === r.id}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
                    >
                      Reject KYC
                    </button>
                  </>
                )}
                {r.status !== "SUSPENDED" ? (
                  <button
                    onClick={() => act(r.id, { status: "SUSPENDED" })}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => act(r.id, { status: "ACTIVE" })}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => grant(r.id, 100)}
                  disabled={busyId === r.id}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
                >
                  +100 credits
                </button>
                {busyId === r.id && <Loader2 size={14} className="animate-spin text-muted" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
