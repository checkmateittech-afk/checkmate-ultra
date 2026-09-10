import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { teamInviteSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/otp";

export async function POST(req: Request) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can add team members" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = teamInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 422 });

  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.role === parsed.data.role) {
      return NextResponse.json({ error: "That person is already on the team" }, { status: 409 });
    }
    const updated = await db.user.update({
      where: { id: existing.id },
      data: { role: parsed.data.role, name: existing.name ?? parsed.data.name, status: "ACTIVE" },
      select: { id: true, name: true, phone: true, role: true },
    });
    return NextResponse.json({ ok: true, promoted: true, user: updated });
  }

  const user = await db.user.create({
    data: { phone, name: parsed.data.name, role: parsed.data.role },
    select: { id: true, name: true, phone: true, role: true },
  });
  return NextResponse.json({ ok: true, user }, { status: 201 });
}
