import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-guard";
import { getSiteSettings } from "@/lib/settings";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
  const [kycPending, reviewsHidden, settings] = await Promise.all([
    isStaff ? db.provider.count({ where: { kycStatus: "SUBMITTED" } }) : 0,
    isStaff ? db.review.count({ where: { status: "HIDDEN" } }) : 0,
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <AdminSidebar
        role={user.role}
        name={user.name ?? user.phone}
        badges={{ providers: kycPending, reviews: reviewsHidden }}
        logoUrl={settings.logoUrl}
        siteName={settings.siteName}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
