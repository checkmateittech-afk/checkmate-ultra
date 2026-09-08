import type { Metadata } from "next";
import { adminProviders } from "@/lib/admin";
import { PageHeader, Panel, Pill } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";
import { ProvidersTable } from "./providers-table";

export const metadata: Metadata = { title: "Admin · Providers" };

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kyc?: string; tier?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const { rows, summary } = await adminProviders(sp);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Providers"
        description="Every business on the marketplace. Approve KYC for a Verified badge, suspend bad actors, top up credits."
        action={
          <div className="flex gap-2 text-xs">
            <Pill>{`ACTIVE`}</Pill>
            <span className="font-semibold text-ink">{summary.ACTIVE ?? 0}</span>
            <Pill>{`PENDING`}</Pill>
            <span className="font-semibold text-ink">{summary.PENDING ?? 0}</span>
            <Pill>{`SUSPENDED`}</Pill>
            <span className="font-semibold text-ink">{summary.SUSPENDED ?? 0}</span>
          </div>
        }
      />

      <FilterBar
        searchPlaceholder="Search name, phone, slug…"
        selects={[
          {
            key: "status",
            label: "Status",
            options: ["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"].map((v) => ({ value: v, label: v })),
          },
          {
            key: "kyc",
            label: "KYC",
            options: ["UNVERIFIED", "SUBMITTED", "VERIFIED", "REJECTED"].map((v) => ({ value: v, label: v })),
          },
          { key: "tier", label: "Plan", options: ["FREE", "STARTER", "PRO"].map((v) => ({ value: v, label: v })) },
          {
            key: "sort",
            label: "Sort",
            options: [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "rating", label: "Rating" },
              { value: "name", label: "Name" },
            ],
          },
        ]}
      />

      <Panel bodyClassName="p-0">
        <ProvidersTable
          providers={rows.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            status: p.status,
            kycStatus: p.kycStatus,
            verified: p.verified,
            tier: p.tier,
            balance: p.wallet?.balance ?? 0,
            rating: p.ratingAvg,
            ratingCount: p.ratingCount,
            leadCount: p._count.leads,
            reviewCount: p._count.reviews,
            city: p.city.name,
            locality: p.locality.name,
            category: p.services[0]?.category.name ?? "—",
            ownerPhone: p.owner?.phone ?? null,
            createdAt: p.createdAt.toISOString(),
            lastKyc: p.kycSubmissions[0]
              ? { docType: p.kycSubmissions[0].docType, docRef: p.kycSubmissions[0].docRef }
              : null,
          }))}
        />
      </Panel>
    </div>
  );
}
