import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { applyLedger } from "@/lib/wallet";

const schema = z.object({ amount: z.coerce.number().int().refine((n) => n !== 0, "Non-zero amount required") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const provider = await db.provider.findUnique({ where: { id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a non-zero amount" }, { status: 422 });

  try {
    const balance = await applyLedger(provider.id, parsed.data.amount, {
      type: "ADJUSTMENT",
      note: `Admin adjustment by ${user.name ?? user.phone}`,
    });
    return NextResponse.json({ ok: true, balance });
  } catch {
    return NextResponse.json({ error: "Adjustment would make the balance negative" }, { status: 422 });
  }
}
