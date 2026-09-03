"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Check, Loader2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo, cn } from "@/lib/utils";

type Pack = { id: string; credits: number; priceInr: number };
type Plan = {
  slug: string;
  name: string;
  priceInr: number;
  monthlyCredits: number;
  leadDiscountPct: number;
  features: string[];
};
type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

const TX_LABEL: Record<string, string> = {
  TOPUP: "Top-up",
  LEAD_CHARGE: "Lead charge",
  REFUND: "Refund",
  BONUS: "Bonus",
  PLAN_GRANT: "Plan credits",
  ADJUSTMENT: "Adjustment",
};

export function WalletPanel({
  balance,
  lifetimeSpent,
  tier,
  packs,
  plans,
  transactions,
}: {
  balance: number;
  lifetimeSpent: number;
  tier: string;
  packs: Pack[];
  plans: Plan[];
  transactions: Tx[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function post(url: string, body: object, key: string) {
    setBusy(key);
    setFlash(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setFlash(data.added ? `Added ${data.added} credits` : "Plan updated");
        router.refresh();
      } else {
        setFlash(data.error ?? "Something went wrong");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <Wallet size={16} className="text-brand-500" />
            <span className="text-xs font-medium">Credit balance</span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-ink">{balance.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-medium text-muted">Lifetime spent</span>
          <p className="mt-2 text-3xl font-extrabold text-ink">{lifetimeSpent.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="text-xs font-medium text-muted">Current plan</span>
          <p className="mt-2 text-3xl font-extrabold text-ink">
            {plans.find((p) => p.slug === tier)?.name ?? tier}
          </p>
        </div>
      </div>

      {flash && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{flash}</p>
      )}

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Add credits</h2>
        <p className="mt-1 text-sm text-muted">One-time top-up. Applied instantly (simulated payment).</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {packs.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-line p-4">
              <p className="text-2xl font-extrabold text-ink">{p.credits}</p>
              <p className="text-xs text-muted">credits</p>
              <p className="mt-2 text-sm font-medium text-ink">₹{p.priceInr.toLocaleString("en-IN")}</p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={busy !== null}
                onClick={() => post("/api/dashboard/wallet/topup", { pack: p.id }, `pack-${p.id}`)}
              >
                {busy === `pack-${p.id}` ? <Loader2 size={14} className="animate-spin" /> : "Buy"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Plans</h2>
        <p className="mt-1 text-sm text-muted">
          Paid plans add monthly credits, a per-lead discount and higher placement in search &amp; matching.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {plans.map((p) => {
            const current = p.slug === tier;
            return (
              <div
                key={p.slug}
                className={cn(
                  "flex flex-col rounded-xl border p-4",
                  current ? "border-brand-400 bg-brand-50" : "border-line",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ink">{p.name}</p>
                  {current && (
                    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {p.priceInr === 0 ? "Free" : `₹${p.priceInr.toLocaleString("en-IN")}/mo`}
                </p>
                <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant={current ? "outline" : "primary"}
                  className="mt-4"
                  disabled={current || busy !== null}
                  onClick={() => post("/api/dashboard/wallet/plan", { planSlug: p.slug }, `plan-${p.slug}`)}
                >
                  {busy === `plan-${p.slug}` ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : current ? (
                    "Active"
                  ) : p.priceInr === 0 ? (
                    "Switch to Free"
                  ) : (
                    "Choose plan"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface">
        <h2 className="border-b border-line px-5 py-3 text-lg font-bold text-ink">Transaction history</h2>
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                      t.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                    )}
                  >
                    {t.amount >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{TX_LABEL[t.type] ?? t.type}</p>
                    {t.note && <p className="truncate text-xs text-muted">{t.note}</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-sm font-semibold", t.amount >= 0 ? "text-emerald-700" : "text-red-600")}>
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount}
                  </p>
                  <p className="text-xs text-muted">
                    bal {t.balanceAfter} · {timeAgo(new Date(t.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
