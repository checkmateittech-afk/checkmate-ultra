import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/account");

  const [kycPending, reviewsHidden] = await Promise.all([
    db.provider.count({ where: { kycStatus: "SUBMITTED" } }),
    db.review.count({ where: { status: "HIDDEN" } }),
  ]);

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
