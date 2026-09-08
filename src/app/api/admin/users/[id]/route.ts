import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  role: z.enum(["CONSUMER", "PROVIDER_OWNER", "PROVIDER_STAFF", "MODERATOR", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getCurrentUser();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (actor.id === id) {
    return NextResponse.json({ error: "You can't modify your own account here" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Moderators can't touch admins or other moderators.
  if (actor.role === "MODERATOR" && (target.role === "ADMIN" || target.role === "MODERATOR")) {
    return NextResponse.json({ error: "Moderators can't modify staff accounts" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 422 });

  if (parsed.data.role && actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can change roles" }, { status: 403 });
  }

  const data: { role?: string; status?: string } = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.status) data.status = parsed.data.status;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  const user = await db.user.update({ where: { id }, data, select: { id: true, role: true, status: true } });
  return NextResponse.json({ ok: true, user });
}
