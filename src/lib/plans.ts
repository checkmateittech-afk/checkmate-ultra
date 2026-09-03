export const PLANS = [
  {
    slug: "FREE",
    name: "Free",
    priceInr: 0,
    monthlyCredits: 0,
    leadDiscountPct: 0,
    rankBoost: 0,
    sortOrder: 0,
    features: ["Public listing & profile", "Pay per lead with credits", "Reply to reviews"].join("\n"),
  },
  {
    slug: "STARTER",
    name: "Starter",
    priceInr: 1499,
    monthlyCredits: 300,
    leadDiscountPct: 10,
    rankBoost: 1,
    sortOrder: 1,
    features: [
      "300 lead credits every month",
      "10% off every lead",
      "Higher placement in search & matching",
      "Basic performance stats",
    ].join("\n"),
  },
  {
    slug: "PRO",
    name: "Pro",
    priceInr: 3999,
    monthlyCredits: 900,
    leadDiscountPct: 20,
    rankBoost: 2,
    sortOrder: 2,
    features: [
      "900 lead credits every month",
      "20% off every lead",
      "Top placement in search & matching",
      "Priority verification",
    ].join("\n"),
  },
] as const;

export type PlanSlug = (typeof PLANS)[number]["slug"];

export function getPlan(slug: string) {
  return PLANS.find((p) => p.slug === slug) ?? PLANS[0];
}
