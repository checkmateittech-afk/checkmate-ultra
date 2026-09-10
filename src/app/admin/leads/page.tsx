import type { Metadata } from "next";
import { requireFullStaff } from "@/lib/admin-guard";
import { adminLeads } from "@/lib/admin";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Panel, Pill } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";

export const metadata: Metadata = { title: "Admin · Leads" };

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string; source?: string }>;
}) {
  await requireFullStaff();
  const sp = await searchParams;
  const [rows, categories, cities] = await Promise.all([
    adminLeads(sp),
    db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.city.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const delivered = rows.reduce((s, r) => s + r.leads.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Leads"
        description="Every customer enquiry and how it fanned out to providers. “Delivered” rows are paid deliveries."
        action={
          <div className="text-xs text-muted">
            <span className="font-semibold text-ink">{rows.length}</span> enquiries ·{" "}
            <span className="font-semibold text-ink">{delivered}</span> deliveries
          </div>
        }
      />

      <FilterBar
        searchPlaceholder="Search name, phone, message…"
        selects={[
          { key: "category", label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
          { key: "city", label: "City", options: cities.map((c) => ({ value: c.slug, label: c.name })) },
          {
            key: "source",
            label: "Source",
            options: [
              { value: "web", label: "web" },
              { value: "sample", label: "sample" },
            ],
          },
        ]}
      />

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">Requirement</th>
                <th className="px-3 py-2.5 font-medium">Category / City</th>
                <th className="px-3 py-2.5 font-medium">Delivered to</th>
                <th className="px-3 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-canvas/60">
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-medium text-ink">{l.name}</p>
                    <p className="text-xs text-muted">{l.phone}</p>
                    {l.user && <p className="text-xs text-muted">acct: {l.user.name ?? l.user.phone}</p>}
                    {l.source !== "web" && <Pill className="mt-1">{l.source.toUpperCase()}</Pill>}
                  </td>
                  <td className="max-w-xs px-3 py-2.5 align-top">
                    <p className="line-clamp-2 text-muted">{l.message}</p>
                  </td>
                  <td className="px-3 py-2.5 align-top text-muted">
                    {[l.categorySlug?.replace(/-/g, " "), l.citySlug].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    {l.leads.length === 0 ? (
                      <span className="text-xs text-muted">not delivered</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {l.leads.map((x, i) => (
                          <span key={i} className="flex items-center gap-1.5 text-xs">
                            <Pill>{x.status}</Pill>
                            <span className="text-muted">{x.provider.name}</span>
                            <span className="tabular-nums text-muted">· {x.creditCost || 0}cr</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top text-xs text-muted">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-muted">
                    No enquiries match these filters.
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
