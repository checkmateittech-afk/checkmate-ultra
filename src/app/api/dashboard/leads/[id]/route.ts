import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { leadStatusSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({ where: { ownerId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const lead = await db.lead.findUnique({ where: { id }, select: { id: true, providerId: true, viewedAt: true } });
  if (!lead || lead.providerId !== provider.id) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = leadStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 422 });

  const { status, note } = parsed.data;
  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      status: status ?? undefined,
      note: note ?? undefined,
      viewedAt:
        !lead.viewedAt && (status === "VIEWED" || status === "CONTACTED" || status === "WON" || status === "LOST")
          ? new Date()
          : undefined,
    },
  });

  return NextResponse.json({ ok: true, lead: { id: updated.id, status: updated.status, note: updated.note } });
}
