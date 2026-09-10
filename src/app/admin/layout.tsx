import { db } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-guard";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
  const [kycPending, reviewsHidden] = isStaff
    ? await Promise.all([
        db.provider.count({ where: { kycStatus: "SUBMITTED" } }),
        db.review.count({ where: { status: "HIDDEN" } }),
      ])
    : [0, 0];

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <AdminSidebar
        role={user.role}
        name={user.name ?? user.phone}
        badges={{ providers: kycPending, reviews: reviewsHidden }}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
