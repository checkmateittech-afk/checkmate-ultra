import "server-only";
import { db } from "@/lib/db";
import { applyLedger, DAILY_LEAD_CAP } from "@/lib/wallet";
import { getPlan } from "@/lib/plans";

const MAX_PROVIDERS_PER_LEAD = 3;

export type DistributionResult = {
  delivered: number;
  charged: number;
  creditsCollected: number;
  skippedNoCredit: number;
};

/**
 * Lead distribution + credit charging.
 * - Direct enquiry (leadRequest.providerId set): delivered free to that provider.
 * - Category + city enquiry: ranked fan-out to matching ACTIVE providers that have
 *   enough credits and are under their daily cap. Each delivery debits the wallet
 *   inside one transaction with an append-only ledger row.
 */
export async function distributeLeadRequest(leadRequestId: string): Promise<DistributionResult> {
  const empty: DistributionResult = { delivered: 0, charged: 0, creditsCollected: 0, skippedNoCredit: 0 };
  const lr = await db.leadRequest.findUnique({ where: { id: leadRequestId } });
  if (!lr) return empty;

  // Direct enquiry — deliver free, no charge.
  if (lr.providerId) {
    const p = await db.provider.findFirst({
      where: { id: lr.providerId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!p) return empty;
    await db.lead.upsert({
      where: { leadRequestId_providerId: { leadRequestId, providerId: p.id } },
      create: { leadRequestId, providerId: p.id, creditCost: 0 },
      update: {},
    });
    return { ...empty, delivered: 1 };
  }

  if (!lr.categorySlug || !lr.citySlug) return empty;

  const category = await db.category.findUnique({
    where: { slug: lr.categorySlug },
    select: { id: true, leadPrice: true },
  });
  if (!category) return empty;

  const candidates = await db.provider.findMany({
    where: {
      status: "ACTIVE",
      city: { slug: lr.citySlug },
      services: { some: { category: { slug: lr.categorySlug } } },
    },
    orderBy: [
      { rankBoost: "desc" },
      { verified: "desc" },
      { ratingAvg: "desc" },
      { ratingCount: "desc" },
    ],
    take: MAX_PROVIDERS_PER_LEAD * 4,
    select: { id: true, tier: true, wallet: { select: { balance: true } } },
  });

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const result: DistributionResult = { ...empty };

  for (const c of candidates) {
    if (result.charged >= MAX_PROVIDERS_PER_LEAD) break;

    const discount = getPlan(c.tier).leadDiscountPct;
    const cost = Math.max(1, Math.round(category.leadPrice * (1 - discount / 100)));
    const balance = c.wallet?.balance ?? 0;

    if (balance < cost) {
      result.skippedNoCredit++;
      continue;
    }

    const todayCount = await db.lead.count({
      where: { providerId: c.id, createdAt: { gte: since } },
    });
    if (todayCount >= DAILY_LEAD_CAP) continue;

    try {
      await db.$transaction(async (tx) => {
        await tx.lead.create({
          data: { leadRequestId, providerId: c.id, creditCost: cost, chargedAt: new Date() },
        });
        await applyLedger(
          c.id,
          -cost,
          { type: "LEAD_CHARGE", refType: "lead_request", refId: leadRequestId, note: `Lead in ${lr.categorySlug}` },
          tx,
        );
      });
      result.delivered++;
      result.charged++;
      result.creditsCollected += cost;
    } catch {
      // unique clash or insufficient credit race — skip this provider
    }
  }

  return result;
}

/** New-provider welcome bonus + a few sample leads so the dashboard isn't empty. */
export async function seedSampleLeads(providerId: string, categorySlug: string, citySlug: string) {
  const samples = [
    { name: "Ravi Kumar", phone: "+919845012345", message: `Need ${categorySlug.replace(/-/g, " ")} for a 2BHK this weekend. Please share a quote.` },
    { name: "Sneha Menon", phone: "+919812345670", message: `Looking for a reliable ${categorySlug.replace(/-/g, " ")} provider near me. What are your charges?` },
    { name: "Imran Shaikh", phone: "+919900011223", message: `Urgent requirement for ${categorySlug.replace(/-/g, " ")}. Are you available tomorrow morning?` },
  ];
  for (const s of samples) {
    const lr = await db.leadRequest.create({
      data: { ...s, categorySlug, citySlug, providerId, source: "sample", status: "NEW" },
    });
    await db.lead.create({ data: { leadRequestId: lr.id, providerId, creditCost: 0 } });
  }
}
