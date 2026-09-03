import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { applyLedger } from "@/lib/wallet";
import { getPlan } from "@/lib/plans";

const schema = z.object({ planSlug: z.enum(["FREE", "STARTER", "PRO"]) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({
    where: { ownerId: user.id },
    select: { id: true, tier: true },
  });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan" }, { status: 422 });

  const plan = getPlan(parsed.data.planSlug);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.$transaction([
    db.provider.update({
      where: { id: provider.id },
      data: { tier: plan.slug, rankBoost: plan.rankBoost },
    }),
    db.subscription.upsert({
      where: { providerId: provider.id },
      create: { providerId: provider.id, planSlug: plan.slug, currentPeriodEnd: periodEnd, status: "ACTIVE" },
      update: { planSlug: plan.slug, currentPeriodEnd: periodEnd, status: "ACTIVE" },
    }),
  ]);

  let balance: number | undefined;
  if (plan.monthlyCredits > 0) {
    balance = await applyLedger(provider.id, plan.monthlyCredits, {
      type: "PLAN_GRANT",
      note: `${plan.name} plan — ${plan.monthlyCredits} monthly credits (simulated activation)`,
    });
  }

  return NextResponse.json({ ok: true, tier: plan.slug, balance });
}
