import type { Metadata } from "next";
import { requireFullStaff } from "@/lib/admin-guard";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Gift, Coins, RefreshCcw } from "lucide-react";
import { adminFinance } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Panel, StatCard, Pill } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";

export const metadata: Metadata = { title: "Admin · Finance" };

const TX_TYPES = ["TOPUP", "LEAD_CHARGE", "BONUS", "PLAN_GRANT", "ADJUSTMENT", "REFUND"];

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireFullStaff();
  const { type } = await searchParams;
  const f = await adminFinance(type);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Finance"
        description="The credit economy: what's been sold, granted and spent, plus every wallet transaction. Payments are simulated in this build."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Credits in circulation" value={f.totals.inCirculation} icon={Wallet} sub={`${f.totals.walletCount} wallets`} />
        <StatCard label="Credits sold (top-ups)" value={f.totals.sold} icon={TrendingUp} tone="ok" />
        <StatCard label="Credits granted" value={f.totals.granted} icon={Gift} sub="bonuses + plan credits" />
        <StatCard label="Spent on leads" value={f.totals.leadCharges} icon={TrendingDown} tone="brand" />
        <StatCard label="Lifetime provider spend" value={f.totals.lifetimeSpent} icon={Coins} />
        <StatCard label="Admin adjustments" value={f.totals.adjustments} icon={RefreshCcw} />
        <StatCard label="Refunds" value={f.totals.refunds} icon={RefreshCcw} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="By transaction type" bodyClassName="p-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {f.byType.map((b) => (
                <tr key={b.type}>
                  <td className="px-4 py-2.5">
                    <Pill>{b.type}</Pill>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{b.count}×</td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                      b.sum >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {b.sum >= 0 ? "+" : ""}
                    {b.sum.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Highest balances" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {f.topWallets.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <Link href={`/business/${w.provider.slug}`} target="_blank" className="truncate font-medium text-ink hover:text-brand-600">
                  {w.provider.name}
                </Link>
                <span className="flex items-center gap-2">
                  <Pill>{w.provider.tier}</Pill>
                  <span className="tabular-nums text-ink">{w.balance}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Lowest balances" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {f.lowWallets.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <Link href={`/business/${w.provider.slug}`} target="_blank" className="truncate font-medium text-ink hover:text-brand-600">
                  {w.provider.name}
                </Link>
                <span className="flex items-center gap-2">
                  <Pill>{w.provider.tier}</Pill>
                  <span className={`tabular-nums ${w.balance <= 0 ? "font-semibold text-red-600" : "text-ink"}`}>
                    {w.balance}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Transaction ledger" bodyClassName="p-0">
        <div className="border-b border-line p-3">
          <FilterBar
            hideSearch
            selects={[{ key: "type", label: "Type", options: TX_TYPES.map((v) => ({ value: v, label: v })) }]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5 font-medium">Provider</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Note</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 text-right font-medium">Balance</th>
                <th className="px-3 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {f.ledger.map((t) => (
                <tr key={t.id} className="hover:bg-canvas/60">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/business/${t.wallet.provider.slug}`}
                      target="_blank"
                      className="font-medium text-ink hover:text-brand-600"
                    >
                      {t.wallet.provider.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{t.type}</Pill>
                  </td>
                  <td className="max-w-xs px-3 py-2.5">
                    <span className="line-clamp-1 text-xs text-muted">{t.note ?? "—"}</span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold tabular-nums ${
                      t.amount >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{t.balanceAfter}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{timeAgo(t.createdAt)}</td>
                </tr>
              ))}
              {f.ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-muted">
                    No transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
