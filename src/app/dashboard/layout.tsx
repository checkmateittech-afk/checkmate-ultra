import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, CheckCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { DashboardNavLink } from "./nav-link";
import { DashboardSignOut } from "./sign-out";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [provider, settings] = await Promise.all([getOwnedProvider(user.id), getSiteSettings()]);
  if (!provider) redirect("/business/join");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteName} className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                <CheckCheck size={17} strokeWidth={2.5} />
              </span>
            )}
            <span className="font-extrabold text-ink">
              {settings.siteName} <span className="font-medium text-muted">for business</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:block">{user.name ?? user.phone}</span>
            <DashboardSignOut />
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="truncate text-sm font-bold text-ink">{provider.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {provider.locality.name}, {provider.city.name}
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                provider.verified
                  ? "bg-emerald-50 text-emerald-700"
                  : provider.kycStatus === "SUBMITTED"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-canvas text-muted"
              }`}
            >
              {provider.verified ? "Verified" : provider.kycStatus === "SUBMITTED" ? "Verification pending" : "Not verified"}
            </span>
          </div>

          <nav className="mt-3 flex flex-col gap-1">
            <DashboardNavLink href="/dashboard" iconName="LayoutDashboard" exact>
              Overview
            </DashboardNavLink>
            <DashboardNavLink href="/dashboard/leads" iconName="Inbox">
              Leads
            </DashboardNavLink>
            <DashboardNavLink href="/dashboard/reviews" iconName="Star">
              Reviews
            </DashboardNavLink>
            <DashboardNavLink href="/dashboard/wallet" iconName="Wallet">
              Wallet &amp; plan
            </DashboardNavLink>
            <DashboardNavLink href="/dashboard/profile" iconName="Store">
              Business profile
            </DashboardNavLink>
            <Link
              href={`/business/${provider.slug}`}
              target="_blank"
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink"
            >
              <ExternalLink size={16} /> View public page
            </Link>
          </nav>
        </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
