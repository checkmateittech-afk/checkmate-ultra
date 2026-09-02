import "server-only";
import { db } from "@/lib/db";

const MAX_PROVIDERS_PER_LEAD = 3;

/**
 * Minimal lead distribution. A full matching + credit engine is a later module;
 * for now: a direct enquiry goes to that provider, and a category+city enquiry
 * fans out to a few matching active providers.
 */
export async function distributeLeadRequest(leadRequestId: string) {
  const lr = await db.leadRequest.findUnique({ where: { id: leadRequestId } });
  if (!lr) return { delivered: 0 };

  let providerIds: string[] = [];

  if (lr.providerId) {
    const p = await db.provider.findFirst({
      where: { id: lr.providerId, status: "ACTIVE" },
      select: { id: true },
    });
    if (p) providerIds = [p.id];
  } else if (lr.categorySlug && lr.citySlug) {
    const matches = await db.provider.findMany({
      where: {
        status: "ACTIVE",
        city: { slug: lr.citySlug },
        services: { some: { category: { slug: lr.categorySlug } } },
      },
      orderBy: [{ verified: "desc" }, { ratingAvg: "desc" }, { ratingCount: "desc" }],
      take: MAX_PROVIDERS_PER_LEAD,
      select: { id: true },
    });
    providerIds = matches.map((m) => m.id);
  }

  if (providerIds.length === 0) return { delivered: 0 };

  await db.lead.createMany({
    data: providerIds.map((providerId) => ({ leadRequestId, providerId })),
  });

  return { delivered: providerIds.length };
}

/** Seed a few sample leads for a brand-new provider so the dashboard isn't empty. */
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
    await db.lead.create({ data: { leadRequestId: lr.id, providerId } });
  }
}
