import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { applyLedger, CREDIT_PACKS } from "@/lib/wallet";

const schema = z.object({ pack: z.enum(["100", "500", "2000"]) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({ where: { ownerId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid pack" }, { status: 422 });

  const pack = CREDIT_PACKS.find((p) => p.id === parsed.data.pack)!;
  const balance = await applyLedger(provider.id, pack.credits, {
    type: "TOPUP",
    note: `Top-up: ${pack.credits} credits (₹${pack.priceInr}) — simulated, Razorpay integration pending`,
  });

  return NextResponse.json({ ok: true, balance, added: pack.credits });
}
