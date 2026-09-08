"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function DashboardSignOut() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-canvas"
    >
      <LogOut size={14} /> Sign out
    </button>
  );
}
