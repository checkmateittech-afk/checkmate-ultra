import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider, getProviderLeads } from "@/lib/queries";
import { LeadsTable } from "./leads-table";

export const metadata: Metadata = { title: "Leads" };

export default async function DashboardLeads() {
  const user = (await getCurrentUser())!;
  const provider = (await getOwnedProvider(user.id))!;
  const leads = await getProviderLeads(provider.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Leads</h1>
        <p className="mt-1 text-sm text-muted">
          Customer enquiries matched to {provider.name}. Update the status as you follow up.
        </p>
      </div>

      <LeadsTable
        leads={leads.map((l) => ({
          id: l.id,
          status: l.status,
          note: l.note,
          createdAt: l.createdAt.toISOString(),
          name: l.leadRequest.name,
          phone: l.leadRequest.phone,
          email: l.leadRequest.email,
          message: l.leadRequest.message,
          categorySlug: l.leadRequest.categorySlug,
          citySlug: l.leadRequest.citySlug,
        }))}
      />
    </div>
  );
}
