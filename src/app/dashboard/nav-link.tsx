"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, Store, Star, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { LayoutDashboard, Inbox, Store, Star, Wallet };

export function DashboardNavLink({
  href,
  iconName,
  exact = false,
  children,
}: {
  href: string;
  iconName: keyof typeof ICONS | string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const Icon = ICONS[iconName] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
        active ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas",
      )}
    >
      <Icon size={16} className={active ? "text-brand-600" : "text-muted"} />
      {children}
    </Link>
  );
}
