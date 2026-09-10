"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Check } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pill } from "../_components/admin-ui";
import { timeAgo } from "@/lib/utils";

type Member = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  status: string;
  courses: number;
  createdAt: string;
  lastLogin: string | null;
};

const ROLES = ["EDITOR", "MODERATOR", "ADMIN"];

export function TeamManager({ members: initial, meId }: { members: Member[]; meId: string }) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? "Could not add" });
        return;
      }
      setMsg({
        kind: "ok",
        text: `${data.user.name} added as ${data.user.role}. They sign in at /login with ${data.user.phone}.`,
      });
      setName("");
      setPhone("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: { role?: string; status?: string }) {
    setRowBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((m) => m.map((x) => (x.id === id ? { ...x, ...body } : x)));
        router.refresh();
      } else {
        setMsg({ kind: "err", text: data.error ?? "Update failed" });
      }
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div>
      <form onSubmit={invite} className="flex flex-wrap items-end gap-2 border-b border-line p-4">
        <div className="flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium text-muted">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-9 text-sm sm:w-48" required />
        </div>
        <div className="flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium text-muted">Mobile</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" className="h-9 text-sm sm:w-44" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Role</label>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 text-sm sm:w-40">
            <option value="EDITOR">Editor</option>
            <option value="MODERATOR">Moderator</option>
          </Select>
        </div>
        <Button type="submit" disabled={busy} className="h-9">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          Add member
        </Button>
      </form>

      {msg && (
        <p
          className={`flex items-center gap-1.5 px-4 py-2 text-sm ${
            msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.kind === "ok" && <Check size={14} />}
          {msg.text}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Member</th>
              <th className="px-4 py-2.5 text-right font-medium">Courses</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => {
              const self = m.id === meId;
              return (
                <tr key={m.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">
                      {m.name ?? "—"} {self && <span className="text-xs font-normal text-muted">(you)</span>}
                    </p>
                    <p className="text-xs text-muted">{m.phone}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{m.courses}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {timeAgo(new Date(m.createdAt))}
                    {m.lastLogin && <span className="block">seen {timeAgo(new Date(m.lastLogin))}</span>}
                    {!m.lastLogin && <span className="block text-amber-600">not signed in yet</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {self ? (
                      <Pill>{m.role}</Pill>
                    ) : (
                      <select
                        value={m.role}
                        disabled={rowBusy === m.id}
                        onChange={(e) => patch(m.id, { role: e.target.value })}
                        className="h-8 rounded-lg border border-line bg-surface px-2 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Pill>{m.status}</Pill>
                      {!self &&
                        (m.status === "ACTIVE" ? (
                          <button
                            onClick={() => patch(m.id, { status: "SUSPENDED" })}
                            disabled={rowBusy === m.id}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => patch(m.id, { status: "ACTIVE" })}
                            disabled={rowBusy === m.id}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Restore
                          </button>
                        ))}
                      {rowBusy === m.id && <Loader2 size={13} className="animate-spin text-muted" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
