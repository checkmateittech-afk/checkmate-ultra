"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, BadgeCheck, ExternalLink, ChevronDown } from "lucide-react";
import { Pill } from "../_components/admin-ui";
import { timeAgo } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  kycStatus: string;
  verified: boolean;
  tier: string;
  balance: number;
  rating: number;
  ratingCount: number;
  leadCount: number;
  reviewCount: number;
  city: string;
  locality: string;
  category: string;
  ownerPhone: string | null;
  createdAt: string;
  lastKyc: { docType: string; docRef: string } | null;
};

export function ProvidersTable({ providers }: { providers: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(providers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [grantAmt, setGrantAmt] = useState("100");

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
                  verified:
                    patch.kycDecision === "VERIFIED" ? true : patch.kycDecision === "REJECTED" ? false : r.verified,
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
    if (!amount) return;
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

  if (rows.length === 0) {
    return <p className="p-10 text-center text-sm text-muted">No providers match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5 font-medium">Business</th>
            <th className="px-3 py-2.5 font-medium">Location</th>
            <th className="px-3 py-2.5 font-medium">Plan</th>
            <th className="px-3 py-2.5 text-right font-medium">Credits</th>
            <th className="px-3 py-2.5 text-right font-medium">Rating</th>
            <th className="px-3 py-2.5 text-right font-medium">Leads</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr className="hover:bg-canvas/60">
                <td className="px-3 py-2.5">
                  <Link
                    href={`/business/${r.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand-600"
                  >
                    {r.name}
                    {r.verified && <BadgeCheck size={13} className="text-emerald-600" />}
                    <ExternalLink size={11} className="text-muted" />
                  </Link>
                  <p className="text-xs text-muted">
                    {r.category}
                    {r.ownerPhone ? ` · ${r.ownerPhone}` : " · no owner"} · {timeAgo(new Date(r.createdAt))}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-muted">
                  {r.locality}, {r.city}
                </td>
                <td className="px-3 py-2.5">
                  <Pill>{r.tier}</Pill>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className={r.balance <= 0 ? "font-semibold text-red-600" : "text-ink"}>{r.balance}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                  {r.ratingCount ? `${r.rating.toFixed(1)} (${r.ratingCount})` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">{r.leadCount}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <Pill>{r.status}</Pill>
                    <Pill>{r.kycStatus}</Pill>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-canvas"
                  >
                    Manage
                    <ChevronDown size={13} className={openId === r.id ? "rotate-180 transition" : "transition"} />
                  </button>
                </td>
              </tr>
              {openId === r.id && (
                <tr className="bg-canvas/60">
                  <td colSpan={8} className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.lastKyc && (
                        <span className="text-xs text-muted">
                          Doc: <span className="font-medium text-ink">{r.lastKyc.docType}</span> {r.lastKyc.docRef}
                        </span>
                      )}
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
                            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface"
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
                      <span className="mx-1 h-4 w-px bg-line" />
                      <input
                        value={grantAmt}
                        onChange={(e) => setGrantAmt(e.target.value.replace(/[^-0-9]/g, ""))}
                        className="h-8 w-20 rounded-lg border border-line bg-surface px-2 text-xs"
                        placeholder="±credits"
                      />
                      <button
                        onClick={() => grant(r.id, Number(grantAmt))}
                        disabled={busyId === r.id}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface"
                      >
                        Adjust credits
                      </button>
                      {busyId === r.id && <Loader2 size={14} className="animate-spin text-muted" />}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
