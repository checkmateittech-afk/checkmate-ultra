import type { Metadata } from "next";
import { adminUsers } from "@/lib/admin";
import { PageHeader, Panel } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Admin · Users" };

const ROLES = ["CONSUMER", "PROVIDER_OWNER", "PROVIDER_STAFF", "MODERATOR", "ADMIN"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const { rows, summary } = await adminUsers(sp);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users"
        description="Everyone with an account. Change roles, suspend accounts. Provider owners are linked to their business."
        action={
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {ROLES.map((r) => (
              <span key={r}>
                {r.replace(/_/g, " ").toLowerCase()} <span className="font-semibold text-ink">{summary[r] ?? 0}</span>
              </span>
            ))}
          </div>
        }
      />

      <FilterBar
        searchPlaceholder="Search name, phone, email…"
        selects={[
          { key: "role", label: "Role", options: ROLES.map((v) => ({ value: v, label: v.replace(/_/g, " ") })) },
          { key: "status", label: "Status", options: ["ACTIVE", "SUSPENDED"].map((v) => ({ value: v, label: v })) },
        ]}
      />

      <Panel bodyClassName="p-0">
        <UsersTable
          users={rows.map((u) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role,
            status: u.status,
            leadCount: u._count.leads,
            reviewCount: u._count.reviews,
            provider: u.provider ? { name: u.provider.name, slug: u.provider.slug, status: u.provider.status } : null,
            createdAt: u.createdAt.toISOString(),
            lastLogin: u.lastLogin?.toISOString() ?? null,
          }))}
        />
      </Panel>
    </div>
  );
}
