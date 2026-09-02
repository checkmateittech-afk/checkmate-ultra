import type { Metadata } from "next";
import { adminListProviders } from "@/lib/queries";
import { ProvidersTable } from "./providers-table";

export const metadata: Metadata = { title: "Admin · Providers" };

export default async function AdminProviders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kyc?: string }>;
}) {
  const { status, kyc } = await searchParams;
  const providers = await adminListProviders({ status, kyc });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Providers</h1>
        <p className="mt-1 text-sm text-muted">
          Approve KYC to grant a Verified badge. Suspend to remove from public listings.
        </p>
      </div>
      <ProvidersTable
        activeStatus={status ?? ""}
        activeKyc={kyc ?? ""}
        providers={providers.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
          kycStatus: p.kycStatus,
          verified: p.verified,
          city: p.city.name,
          locality: p.locality.name,
          category: p.services[0]?.category.name ?? "—",
          ownerPhone: p.owner?.phone ?? null,
          lastKyc: p.kycSubmissions[0]
            ? { docType: p.kycSubmissions[0].docType, docRef: p.kycSubmissions[0].docRef }
            : null,
        }))}
      />
    </div>
  );
}
