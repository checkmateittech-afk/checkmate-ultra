import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { getSiteSettings } from "@/lib/settings";
import { PageHeader, Panel } from "../_components/admin-ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Admin · Settings" };

export default async function AdminSettingsPage() {
  await requireSuperAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Platform settings"
        description="Branding and platform-wide controls. Only admins can see or change this page."
      />
      <Panel bodyClassName="p-0">
        <SettingsForm settings={settings} />
      </Panel>
    </div>
  );
}
