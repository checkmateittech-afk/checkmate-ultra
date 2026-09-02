import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AdminNavLink } from "./nav-link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/account");

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3">
            <ShieldCheck size={18} className="text-brand-500" />
            <div>
              <p className="text-sm font-bold text-ink">Admin</p>
              <p className="text-xs text-muted">{user.role}</p>
            </div>
          </div>
          <nav className="mt-3 flex flex-col gap-1">
            <AdminNavLink href="/admin" label="Overview" exact />
            <AdminNavLink href="/admin/providers" label="Providers" />
            <AdminNavLink href="/admin/reviews" label="Reviews" />
            <AdminNavLink href="/admin/leads" label="Leads" />
            <Link href="/" className="mt-1 rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink">
              ← Back to site
            </Link>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
