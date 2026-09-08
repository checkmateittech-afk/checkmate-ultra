import type { Metadata } from "next";
import Link from "next/link";
import { adminActivity } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Panel } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";

export const metadata: Metadata = { title: "Admin · Activity log" };

const DOT: Record<string, string> = {
  lead: "bg-brand-500",
  review: "bg-amber-500",
  kyc: "bg-emerald-500",
  user: "bg-blue-500",
  credit: "bg-navy-700",
};

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const rows = await adminActivity(kind);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Activity log" description="A merged timeline of enquiries, reviews, KYC, signups and credit movements." />

      <FilterBar
        hideSearch
        selects={[
          {
            key: "kind",
            label: "Type",
            options: [
              { value: "lead", label: "Enquiries" },
              { value: "review", label: "Reviews" },
              { value: "kyc", label: "KYC" },
              { value: "user", label: "Signups" },
              { value: "credit", label: "Credits" },
            ],
          },
        ]}
      />

      <Panel bodyClassName="p-0">
        <ul className="divide-y divide-line">
          {rows.map((a, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[a.kind] ?? "bg-muted"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {a.href ? (
                    <Link href={a.href} target="_blank" className="hover:text-brand-600">
                      {a.title}
                    </Link>
                  ) : (
                    a.title
                  )}
                </p>
                <p className="truncate text-xs text-muted">{a.sub}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{timeAgo(a.when)}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="p-10 text-center text-sm text-muted">Nothing here yet.</li>}
        </ul>
      </Panel>
    </div>
  );
}
