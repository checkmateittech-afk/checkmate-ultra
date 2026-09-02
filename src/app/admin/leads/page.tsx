import type { Metadata } from "next";
import { adminRecentLeads } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Leads" };

export default async function AdminLeads() {
  const leads = await adminRecentLeads();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Recent leads</h1>
        <p className="mt-1 text-sm text-muted">
          Last {leads.length} enquiries. &ldquo;Delivered&rdquo; is how many providers each was fanned out to.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Requirement</th>
              <th className="px-4 py-2.5">Category / City</th>
              <th className="px-4 py-2.5">Delivered</th>
              <th className="px-4 py-2.5">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{l.name}</p>
                  <p className="text-xs text-muted">{l.phone}</p>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="line-clamp-2 text-muted">{l.message}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {[l.categorySlug?.replace(/-/g, " "), l.citySlug].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">{l._count.leads}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{timeAgo(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
