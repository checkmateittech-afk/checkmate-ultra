import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Users,
  Inbox,
  Star,
  Wallet,
  BadgeCheck,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { adminDashboard } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Panel, StatCard, BarChart, MiniBars, Pill } from "./_components/admin-ui";

export const metadata: Metadata = { title: "Admin dashboard" };

const ACTIVITY_DOT: Record<string, string> = {
  lead: "bg-brand-500",
  review: "bg-amber-500",
  kyc: "bg-emerald-500",
  user: "bg-blue-500",
  plan: "bg-navy-700",
};

export default async function AdminDashboard() {
  const d = await adminDashboard();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Live view of the marketplace — supply, demand, moderation queues and credit economy."
      />

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Providers"
          value={d.providers.total}
          icon={Store}
          href="/admin/providers"
          sub={`${d.providers.active} active · ${d.providers.pending} pending`}
        />
        <StatCard
          label="Verified"
          value={d.providers.verified}
          icon={BadgeCheck}
          tone="ok"
          sub={`${Math.round((d.providers.verified / Math.max(1, d.providers.total)) * 100)}% of providers`}
        />
        <StatCard label="Users" value={d.users.total} icon={Users} href="/admin/users" sub={`${d.users.byRole.CONSUMER ?? 0} consumers`} />
        <StatCard
          label="Leads (24h)"
          value={d.leads.last24h}
          icon={Inbox}
          tone="brand"
          href="/admin/leads"
          sub={`${d.leads.last7d} in 7d · ${d.leads.total} all-time`}
        />
        <StatCard
          label="Credits in circulation"
          value={d.credits.creditsInCirculation}
          icon={Wallet}
          href="/admin/finance"
          sub={`${d.credits.creditsSpent} spent on leads`}
        />
        <StatCard label="Credits sold" value={d.credits.creditsSold} icon={TrendingUp} tone="ok" sub={`${d.credits.creditsGranted} granted`} />
        <StatCard label="Subscription MRR" value={`₹${d.mrr.toLocaleString("en-IN")}`} icon={IndianRupee} tone="brand" sub={`${d.providers.byTier.STARTER + d.providers.byTier.PRO} paid providers`} />
        <StatCard
          label="Reviews"
          value={d.reviews.total}
          icon={Star}
          href="/admin/reviews"
          tone={d.reviews.hidden > 0 ? "warn" : "default"}
          sub={`${d.reviews.avgRating.toFixed(1)}★ avg · ${d.reviews.hidden} hidden`}
        />
      </div>

      {/* Queues */}
      <Panel title="Needs attention">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QueueItem label="KYC awaiting review" value={d.queues.kycPending} href="/admin/providers?kyc=SUBMITTED" />
          <QueueItem label="Providers pending" value={d.queues.providersPending} href="/admin/providers?status=PENDING" />
          <QueueItem label="Providers suspended" value={d.queues.providersSuspended} href="/admin/providers?status=SUSPENDED" />
          <QueueItem label="Hidden reviews" value={d.queues.reviewsHidden} href="/admin/reviews?status=HIDDEN" />
          <QueueItem label="Zero-credit providers" value={d.queues.zeroCreditProviders} href="/admin/finance" />
          <QueueItem label="Suspended users" value={d.users.suspended} href="/admin/users?status=SUSPENDED" />
        </div>
      </Panel>

      {/* Charts + composition */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Enquiries · last 14 days" className="lg:col-span-2">
          <BarChart data={d.charts.leadsByDay} />
        </Panel>
        <Panel title="Provider mix">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">By status</p>
              <MiniBars
                segments={[
                  { label: "Active", value: d.providers.active, className: "bg-emerald-500" },
                  { label: "Pending", value: d.providers.pending, className: "bg-amber-500" },
                  { label: "Suspended", value: d.providers.suspended, className: "bg-red-500" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">By plan</p>
              <MiniBars
                segments={[
                  { label: "Free", value: d.providers.byTier.FREE, className: "bg-slate-400" },
                  { label: "Starter", value: d.providers.byTier.STARTER, className: "bg-blue-500" },
                  { label: "Pro", value: d.providers.byTier.PRO, className: "bg-brand-500" },
                ]}
              />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="New signups · last 8 weeks">
          <BarChart data={d.charts.signupsByWeek} tone="#1f3a5f" />
        </Panel>
        <Panel title="New providers · last 8 weeks">
          <BarChart data={d.charts.providersByWeek} tone="#059669" />
        </Panel>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top categories" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 text-right font-medium">Providers</th>
                <th className="px-4 py-2 text-right font-medium">Leads</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.topCategories.slice(0, 8).map((c) => (
                <tr key={c.slug}>
                  <td className="px-4 py-2 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{c.providers}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{c.leads}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{c.leadPrice} cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Top providers by leads" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 text-right font-medium">Leads</th>
                <th className="px-4 py-2 text-right font-medium">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.topProvidersByLeads.map((p) => (
                <tr key={p.slug}>
                  <td className="px-4 py-2">
                    <Link href={`/business/${p.slug}`} target="_blank" className="font-medium text-ink hover:text-brand-600">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{p.leads}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{p.creditsEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Activity feed */}
      <Panel
        title="Recent activity"
        action={
          <Link href="/admin/activity" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Full log
          </Link>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-line">
          {d.activity.map((a, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT[a.kind] ?? "bg-muted"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {a.href ? (
                    <Link href={a.href} target="_blank" className="hover:text-brand-600">
                      {a.title}
                    </Link>
                  ) : (
                    a.title
                  )}
                </p>
                <p className="truncate text-xs capitalize text-muted">{a.sub}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{timeAgo(a.when)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Highest rated" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {d.topRated.map((p) => (
              <li key={p.slug} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <Link href={`/business/${p.slug}`} target="_blank" className="font-medium text-ink hover:text-brand-600">
                  {p.name} <span className="text-xs font-normal text-muted">· {p.city}</span>
                </Link>
                <span className="tabular-nums text-muted">
                  {p.ratingAvg.toFixed(1)}★ ({p.ratingCount})
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Cities by supply" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {d.topCities.map((c) => (
              <li key={c.slug} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-medium text-ink">{c.name}</span>
                <span className="tabular-nums text-muted">{c.providers} providers</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function QueueItem({ label, value, href }: { label: string; value: number; href: string }) {
  const hot = value > 0;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
        hot ? "border-amber-300 bg-amber-50 hover:bg-amber-100" : "border-line bg-surface hover:border-brand-300"
      }`}
    >
      <span className="flex items-center gap-2">
        {hot && <AlertTriangle size={14} className="text-amber-600" />}
        <span className={hot ? "font-medium text-amber-900" : "text-muted"}>{label}</span>
      </span>
      <span className="flex items-center gap-1">
        <span className={`text-base font-extrabold tabular-nums ${hot ? "text-amber-700" : "text-ink"}`}>{value}</span>
        <ChevronRight size={14} className="text-muted" />
      </span>
    </Link>
  );
}
