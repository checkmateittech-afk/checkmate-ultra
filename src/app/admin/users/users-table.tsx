"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
import { Pill } from "../_components/admin-ui";
import { timeAgo } from "@/lib/utils";

type Row = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  leadCount: number;
  reviewCount: number;
  provider: { name: string; slug: string; status: string } | null;
  createdAt: string;
  lastLogin: string | null;
};

const ROLES = ["CONSUMER", "PROVIDER_OWNER", "PROVIDER_STAFF", "MODERATOR", "ADMIN"];

export function UsersTable({ users }: { users: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(users);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(id: string, body: { role?: string; status?: string }) {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...body } : r)));
        router.refresh();
      } else {
        setErr(data.error ?? "Update failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) return <p className="p-10 text-center text-sm text-muted">No users match these filters.</p>;

  return (
    <div className="overflow-x-auto">
      {err && <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5 font-medium">User</th>
            <th className="px-3 py-2.5 font-medium">Business</th>
            <th className="px-3 py-2.5 text-right font-medium">Leads</th>
            <th className="px-3 py-2.5 text-right font-medium">Reviews</th>
            <th className="px-3 py-2.5 font-medium">Joined</th>
            <th className="px-3 py-2.5 font-medium">Role</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-canvas/60">
              <td className="px-3 py-2.5">
                <p className="font-medium text-ink">{u.name ?? "—"}</p>
                <p className="text-xs text-muted">
                  {u.phone}
                  {u.email ? ` · ${u.email}` : ""}
                </p>
              </td>
              <td className="px-3 py-2.5">
                {u.provider ? (
                  <Link
                    href={`/business/${u.provider.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-muted hover:text-brand-600"
                  >
                    {u.provider.name} <ExternalLink size={11} />
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{u.leadCount}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{u.reviewCount}</td>
              <td className="px-3 py-2.5 text-xs text-muted">
                {timeAgo(new Date(u.createdAt))}
                {u.lastLogin && <span className="block">seen {timeAgo(new Date(u.lastLogin))}</span>}
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => patch(u.id, { role: e.target.value })}
                  className="h-8 rounded-lg border border-line bg-surface px-2 text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Pill>{u.status}</Pill>
                  {u.status === "ACTIVE" ? (
                    <button
                      onClick={() => patch(u.id, { status: "SUSPENDED" })}
                      disabled={busyId === u.id}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => patch(u.id, { status: "ACTIVE" })}
                      disabled={busyId === u.id}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Restore
                    </button>
                  )}
                  {busyId === u.id && <Loader2 size={13} className="animate-spin text-muted" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
