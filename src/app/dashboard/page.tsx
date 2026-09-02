import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Sparkle, Trophy, Star, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider, getProviderLeads, providerDashboardStats } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverview() {
  const user = (await getCurrentUser())!;
  const provider = (await getOwnedProvider(user.id))!;
  const [stats, leads] = await Promise.all([
    providerDashboardStats(provider.id),
    getProviderLeads(provider.id),
  ]);
  const recent = leads.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">How {provider.name} is doing on Checkmate.</p>
      </div>

      {!provider.verified && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {provider.kycStatus === "SUBMITTED" ? (
              <ShieldCheck className="mt-0.5 shrink-0 text-amber-600" size={20} />
            ) : (
              <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={20} />
            )}
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {provider.kycStatus === "SUBMITTED" ? "Verification under review" : "Verify your business"}
              </p>
              <p className="text-sm text-amber-800">
                {provider.kycStatus === "SUBMITTED"
                  ? "We'll update your badge once your documents are reviewed."
                  : "Verified businesses rank higher and win more enquiries."}
              </p>
            </div>
          </div>
          {provider.kycStatus !== "SUBMITTED" && (
            <Link
              href="/dashboard/profile#verify"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Start verification <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Inbox} label="Total leads" value={stats.total} />
        <Stat icon={Sparkle} label="New leads" value={stats.fresh} accent />
        <Stat icon={Trophy} label="Won" value={stats.won} />
        <Stat
          icon={Star}
          label="Rating"
          value={stats.provider?.ratingCount ? stats.provider.ratingAvg.toFixed(1) : "—"}
          sub={stats.provider?.ratingCount ? `${stats.provider.ratingCount} reviews` : "No reviews yet"}
        />
      </div>

      <section className="rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-bold text-ink">Recent leads</h2>
          <Link href="/dashboard/leads" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No leads yet. They&apos;ll appear here as customers post requirements in your category and city.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{l.leadRequest.name}</p>
                  <p className="truncate text-sm text-muted">{l.leadRequest.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">{l.status}</span>
                  <span className="hidden text-xs text-muted sm:block">{timeAgo(l.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={16} className={accent ? "text-brand-500" : ""} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-extrabold ${accent && value ? "text-brand-600" : "text-ink"}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
