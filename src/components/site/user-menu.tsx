"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound, LayoutDashboard, Shield } from "lucide-react";
import { gradientFromSeed, initials } from "@/lib/utils";

type Props = {
  name: string | null;
  phone: string;
  role: string;
};

export function UserMenu({ name, phone, role }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = name || `+91 ${phone.replace(/^\+91/, "")}`;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1 pl-1 pr-2 text-sm font-medium hover:bg-canvas"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ backgroundImage: gradientFromSeed(phone || label) }}
        >
          {initials(name || "U")}
        </span>
        <span className="hidden max-w-28 truncate sm:block">{label}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name || "Your account"}</p>
            <p className="text-xs text-muted">+91 {phone.replace(/^\+91/, "")}</p>
          </div>
          <MenuLink href="/account" icon={UserRound} onClick={() => setOpen(false)}>
            My account
          </MenuLink>
          {(role === "PROVIDER_OWNER" || role === "PROVIDER_STAFF") && (
            <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
              Business dashboard
            </MenuLink>
          )}
          {(role === "ADMIN" || role === "MODERATOR") && (
            <MenuLink href="/admin" icon={Shield} onClick={() => setOpen(false)}>
              Admin console
            </MenuLink>
          )}
          <button
            onClick={logout}
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-canvas"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof UserRound;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-canvas"
    >
      <Icon size={15} className="text-muted" /> {children}
    </Link>
  );
}
