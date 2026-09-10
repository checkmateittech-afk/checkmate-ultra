import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { adminListTeam } from "@/lib/courses";
import { PageHeader, Panel } from "../_components/admin-ui";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Admin · Team" };

export default async function AdminTeamPage() {
  const me = await requireSuperAdmin();
  const team = await adminListTeam();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Team"
        description="People who can manage content. Editors can only write and publish courses; moderators also handle the marketplace. Everyone signs in with their mobile number."
      />
      <Panel bodyClassName="p-0">
        <TeamManager
          meId={me.id}
          members={team.map((u) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            role: u.role,
            status: u.status,
            courses: u._count.courses,
            createdAt: u.createdAt.toISOString(),
            lastLogin: u.lastLogin?.toISOString() ?? null,
          }))}
        />
      </Panel>
    </div>
  );
}
