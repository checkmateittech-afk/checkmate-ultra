"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  Inbox,
  Star,
  Wallet,
  Tags,
  Activity,
  GraduationCap,
  UsersRound,
  ShieldCheck,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };
type Group = { title: string; items: Item[]; roles?: string[] };

const GROUPS: Group[] = [
  {
    title: "Overview",
    roles: ["ADMIN", "MODERATOR"],
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Marketplace",
    roles: ["ADMIN", "MODERATOR"],
    items: [
      { href: "/admin/providers", label: "Providers", icon: Store },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Content",
    items: [{ href: "/admin/courses", label: "Courses", icon: GraduationCap }],
  },
  {
    title: "System",
    roles: ["ADMIN", "MODERATOR"],
    items: [
      { href: "/admin/finance", label: "Finance", icon: Wallet },
      { href: "/admin/catalog", label: "Catalog", icon: Tags },
      { href: "/admin/team", label: "Team", icon: UsersRound },
      { href: "/admin/activity", label: "Activity log", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ADMIN_ONLY_HREFS = ["/admin/team", "/admin/settings"];

export function AdminSidebar({
  role,
  name,
  badges,
  logoUrl,
  siteName,
}: {
  role: string;
  name: string;
  badges: { providers?: number; reviews?: number };
  logoUrl?: string | null;
  siteName: string;
}) {
  const groups = GROUPS.filter((g) => !g.roles || g.roles.includes(role));
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <ShieldCheck size={18} strokeWidth={2.5} />
          </span>
        )}
        <span className="truncate text-base font-extrabold text-ink">
          {siteName} <span className="text-muted">admin</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {g.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {g.items
                .filter((it) => !ADMIN_ONLY_HREFS.includes(it.href) || role === "ADMIN")
                .map((it) => {
                const active = it.exact
                  ? pathname === it.href
                  : pathname === it.href || pathname.startsWith(it.href + "/");
                const badge =
                  it.href === "/admin/providers" ? badges.providers : it.href === "/admin/reviews" ? badges.reviews : undefined;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas",
                    )}
                  >
                    <it.icon size={16} className={active ? "text-brand-600" : "text-muted"} />
                    <span className="flex-1">{it.label}</span>
                    {badge ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-xs text-muted">{role}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink"
        >
          <ExternalLink size={15} /> View live site
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-extrabold text-ink">
          <ShieldCheck size={18} className="text-brand-500" /> checkmate admin
        </span>
        <button onClick={() => setOpen(true)} className="rounded-lg border border-line p-1.5">
          <Menu size={18} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{nav}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-surface shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg border border-line p-1.5"
            >
              <X size={16} />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
