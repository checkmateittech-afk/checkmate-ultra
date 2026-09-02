import type { Metadata } from "next";
import Link from "next/link";
import { adminCounts } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const c = await adminCounts();

  const cards = [
    { label: "KYC awaiting review", value: c.kycPending, href: "/admin/providers?kyc=SUBMITTED", accent: c.kycPending > 0 },
    { label: "Providers pending", value: c.providersPending, href: "/admin/providers?status=PENDING" },
    { label: "Hidden reviews", value: c.reviewsHidden, href: "/admin/reviews?status=HIDDEN" },
    { label: "Reviews total", value: c.reviewsTotal, href: "/admin/reviews" },
    { label: "Leads (24h)", value: c.leadsToday, href: "/admin/leads" },
    { label: "Users", value: c.users, href: "/admin/leads" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">Moderation queues and marketplace health.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border bg-surface p-4 transition hover:shadow-sm ${
              card.accent ? "border-brand-300" : "border-line hover:border-brand-300"
            }`}
          >
            <p className="text-xs font-medium text-muted">{card.label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${card.accent ? "text-brand-600" : "text-ink"}`}>{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
