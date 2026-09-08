import { PrismaClient } from "@prisma/client";
import { PLANS } from "../src/lib/plans";

const db = new PrismaClient();

// ---------- deterministic RNG so re-seeds are stable ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

const CATEGORIES = [
  { slug: "packers-and-movers", name: "Packers & Movers", icon: "Truck", blurb: "Home & office relocation, local and intercity.", leadPrice: 40 },
  { slug: "home-cleaning", name: "Home Cleaning", icon: "Sparkles", blurb: "Deep cleaning, kitchen, bathroom and sofa care.", leadPrice: 20 },
  { slug: "electricians", name: "Electricians", icon: "Plug", blurb: "Wiring, repairs, fittings and inverter setup.", leadPrice: 15 },
  { slug: "plumbers", name: "Plumbers", icon: "Wrench", blurb: "Leak fixes, taps, tanks and bathroom fittings.", leadPrice: 15 },
  { slug: "painters", name: "Painters", icon: "PaintRoller", blurb: "Interior, exterior, texture and waterproofing.", leadPrice: 30 },
  { slug: "pest-control", name: "Pest Control", icon: "Bug", blurb: "Cockroach, termite, bed bug and mosquito control.", leadPrice: 20 },
  { slug: "ac-service", name: "AC Service & Repair", icon: "Wind", blurb: "Servicing, gas refill, installation and uninstallation.", leadPrice: 18 },
  { slug: "interior-designers", name: "Interior Designers", icon: "Ruler", blurb: "Full-home interiors, modular kitchens and wardrobes.", leadPrice: 80 },
  { slug: "home-tutors", name: "Home Tutors", icon: "GraduationCap", blurb: "CBSE, ICSE and State board tuition, all subjects.", leadPrice: 15 },
  { slug: "yoga-classes", name: "Yoga Classes", icon: "Activity", blurb: "Personal and group sessions, therapy and prenatal.", leadPrice: 15 },
  { slug: "wedding-photographers", name: "Wedding Photographers", icon: "Camera", blurb: "Candid, traditional, pre-wedding and video teams.", leadPrice: 60 },
  { slug: "event-caterers", name: "Event Caterers", icon: "UtensilsCrossed", blurb: "Weddings, parties and corporate — veg & non-veg.", leadPrice: 45 },
];

const CITIES = [
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    localities: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar", "Marathahalli", "Electronic City", "Yelahanka"],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    localities: ["Kothrud", "Baner", "Hinjewadi", "Viman Nagar", "Wakad", "Aundh", "Hadapsar", "Kharadi"],
  },
];

const BRAND_WORDS = ["Sri", "Balaji", "Royal", "Prime", "Elite", "Green", "Star", "Metro", "Trusty", "Apex", "Urban", "Sunrise", "Perfect", "Quick", "Sai", "Crown"];
const SUFFIX_BY_CAT: Record<string, string[]> = {
  "packers-and-movers": ["Packers & Movers", "Relocations", "Cargo Movers", "Logistics"],
  "home-cleaning": ["Home Care", "Cleaning Services", "Facility Care", "Shine Cleaners"],
  electricians: ["Electricals", "Electric Works", "Power Solutions", "Electrical Services"],
  plumbers: ["Plumbing Works", "Plumbing Services", "Sanitary Solutions", "Pipes & Fittings"],
  painters: ["Painters", "Paint House", "Wall Decor", "Colours"],
  "pest-control": ["Pest Control", "Hygiene Services", "Pest Solutions", "Fumigation"],
  "ac-service": ["Cool Care", "AC Services", "Climate Care", "Aircon Experts"],
  "interior-designers": ["Interiors", "Design Studio", "Interior Concepts", "Spaces"],
  "home-tutors": ["Tutorials", "Learning Centre", "Home Tuitions", "Academy"],
  "yoga-classes": ["Yoga Studio", "Wellness", "Yoga Kendra", "Yoga & Fitness"],
  "wedding-photographers": ["Photography", "Studios", "Films", "Frames"],
  "event-caterers": ["Caterers", "Catering Co.", "Food Services", "Kitchen"],
};
const PRICE_META: Record<string, { from: [number, number]; unit: string }> = {
  "packers-and-movers": { from: [4000, 9000], unit: "per move" },
  "home-cleaning": { from: [1200, 3500], unit: "per visit" },
  electricians: { from: [200, 500], unit: "per visit" },
  plumbers: { from: [250, 600], unit: "per visit" },
  painters: { from: [12, 25], unit: "per sq ft" },
  "pest-control": { from: [900, 2500], unit: "per treatment" },
  "ac-service": { from: [450, 800], unit: "per unit" },
  "interior-designers": { from: [120000, 400000], unit: "project onwards" },
  "home-tutors": { from: [400, 900], unit: "per hour" },
  "yoga-classes": { from: [1500, 4000], unit: "per month" },
  "wedding-photographers": { from: [35000, 120000], unit: "per event" },
  "event-caterers": { from: [350, 900], unit: "per plate" },
};

const FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Karthik", "Deepa", "Rohan", "Meera", "Arjun", "Kavya", "Suresh", "Nisha", "Manoj", "Pooja"];
const LAST = ["Sharma", "Iyer", "Reddy", "Nair", "Gupta", "Rao", "Menon", "Patil", "Kulkarni", "Shetty", "Verma", "Joshi"];
const REVIEW_TITLES = ["Very professional", "On time and neat", "Highly recommend", "Good value for money", "Polite and skilled staff", "Job done well", "Slightly delayed but good work", "Excellent service"];
const REVIEW_BODIES = [
  "Booked them through Checkmate and the team arrived on schedule. Work was tidy and they cleaned up afterwards.",
  "Reasonable pricing and no last-minute changes to the quote. Would use again.",
  "Responsive on calls, explained everything clearly before starting. Happy with the result.",
  "Quality of work was good. Took a little longer than promised but the outcome was worth it.",
  "Staff were courteous and careful with our belongings. Smooth experience overall.",
  "Fair estimate, punctual, and stood by their work when we asked for a small fix.",
];
const ABOUT = (cat: string, city: string) =>
  `Established local team serving ${city} and nearby areas. We handle ${cat.toLowerCase()} jobs of every size with trained staff, transparent pricing and on-time service. Free site assessment and written quotes before any work begins.`;

async function main() {
  console.log("Clearing existing data…");
  await db.walletTransaction.deleteMany();
  await db.wallet.deleteMany();
  await db.subscription.deleteMany();
  await db.lead.deleteMany();
  await db.review.deleteMany();
  await db.providerPhoto.deleteMany();
  await db.providerService.deleteMany();
  await db.kycSubmission.deleteMany();
  await db.leadRequest.deleteMany();
  await db.provider.deleteMany();
  await db.locality.deleteMany();
  await db.city.deleteMany();
  await db.category.deleteMany();
  await db.plan.deleteMany();
  await db.otpChallenge.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding plans…");
  for (const p of PLANS) {
    await db.plan.create({ data: { ...p } });
  }

  console.log("Seeding categories…");
  const categoryRows = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    categoryRows.push(await db.category.create({ data: { ...CATEGORIES[i], sortOrder: i } }));
  }

  console.log("Seeding cities & localities…");
  const cityRows = [];
  for (const c of CITIES) {
    const city = await db.city.create({
      data: {
        slug: c.slug,
        name: c.name,
        state: c.state,
        localities: {
          create: c.localities.map((n) => ({ slug: slugify(n), name: n })),
        },
      },
      include: { localities: true },
    });
    cityRows.push(city);
  }

  console.log("Seeding providers…");
  let total = 0;
  for (const city of cityRows) {
    for (const category of categoryRows) {
      const count = between(2, 4);
      for (let n = 0; n < count; n++) {
        const brand = pick(BRAND_WORDS);
        const suffix = pick(SUFFIX_BY_CAT[category.slug]);
        const name = `${brand} ${suffix}`;
        const locality = pick(city.localities);
        const slug = `${slugify(name)}-${city.slug}-${(++total).toString(36)}`;
        const pm = PRICE_META[category.slug];

        const nReviews = between(3, 9);
        const reviews = Array.from({ length: nReviews }).map(() => {
          const stars = pick([5, 5, 5, 4, 4, 4, 3, 5, 4]);
          return {
            authorName: `${pick(FIRST)} ${pick(LAST)}`,
            rating: stars,
            title: pick(REVIEW_TITLES),
            body: pick(REVIEW_BODIES),
            createdAt: new Date(Date.now() - between(1, 400) * 86400000),
          };
        });
        const ratingAvg = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

        // 60% single-category providers, 40% also offer one adjacent category
        const extra = rnd() < 0.4 ? pick(categoryRows.filter((c) => c.id !== category.id)) : null;
        const isVerified = rnd() < 0.6;
        const tierRoll = rnd();
        const tier = tierRoll > 0.92 ? "PRO" : tierRoll > 0.78 ? "STARTER" : "FREE";
        const rankBoost = tier === "PRO" ? 2 : tier === "STARTER" ? 1 : 0;
        // ~20% of free providers have an empty wallet (won't receive fan-out leads).
        const startBalance =
          tier === "PRO" ? between(500, 1200) : tier === "STARTER" ? between(150, 600) : rnd() < 0.2 ? 0 : between(15, 250);

        const provider = await db.provider.create({
          data: {
            slug,
            name,
            about: ABOUT(category.name, city.name),
            phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
            email: `${slugify(brand)}.${category.slug.split("-")[0]}@example.com`,
            verified: isVerified,
            status: "ACTIVE",
            kycStatus: isVerified ? "VERIFIED" : "UNVERIFIED",
            tier,
            rankBoost,
            yearsInBusiness: between(1, 18),
            ratingAvg,
            ratingCount: nReviews,
            addressLine: `${between(1, 220)}, ${locality.name} Main Road`,
            cityId: city.id,
            localityId: locality.id,
            services: {
              create: [
                { categoryId: category.id, priceFrom: between(pm.from[0], pm.from[1]), priceUnit: pm.unit },
                ...(extra
                  ? [
                      {
                        categoryId: extra.id,
                        priceFrom: between(PRICE_META[extra.slug].from[0], PRICE_META[extra.slug].from[1]),
                        priceUnit: PRICE_META[extra.slug].unit,
                      },
                    ]
                  : []),
              ],
            },
            createdAt: new Date(Date.now() - between(0, 75) * 86400000),
            reviews: { create: reviews },
            photos: {
              create: Array.from({ length: between(3, 5) }).map((_, i) => ({
                label: `${category.name} work sample ${i + 1}`,
                tint: pick(["f2620f", "1f3a5f", "0f766e", "7c3aed", "b45309", "be123c"]),
                sortOrder: i,
              })),
            },
          },
        });

        const wallet = await db.wallet.create({
          data: { providerId: provider.id, balance: startBalance },
        });
        if (startBalance > 0) {
          await db.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: tier === "FREE" ? "TOPUP" : "PLAN_GRANT",
              amount: startBalance,
              balanceAfter: startBalance,
              note: tier === "FREE" ? "Initial top-up" : `${tier} plan monthly credits`,
            },
          });
        }
        if (tier !== "FREE") {
          const end = new Date();
          end.setMonth(end.getMonth() + 1);
          await db.subscription.create({
            data: { providerId: provider.id, planSlug: tier, currentPeriodEnd: end },
          });
        }
      }
    }
  }

  console.log("Seeding users…");
  await db.user.createMany({
    data: [
      { phone: "+919000000001", name: "Checkmate Admin", email: "admin@checkmate.local", role: "ADMIN" },
      { phone: "+919000000002", name: "Moderator", email: "mod@checkmate.local", role: "MODERATOR" },
      { phone: "+919888800001", name: "Anita Rao", role: "CONSUMER" },
    ],
  });
  // Historical consumer signups spread over the last ~60 days (for admin charts).
  const histUsers = Array.from({ length: 44 }).map((_, i) => ({
    phone: `+9187${i.toString().padStart(4, "0")}${between(100000, 999999)}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    role: "CONSUMER",
    createdAt: new Date(Date.now() - between(0, 60) * 86400000),
    lastLogin: rnd() < 0.5 ? new Date(Date.now() - between(0, 20) * 86400000) : null,
  }));
  await db.user.createMany({ data: histUsers });

  console.log("Seeding historical enquiries…");
  const allProviders = await db.provider.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      tier: true,
      services: { select: { category: { select: { slug: true } } } },
      city: { select: { slug: true } },
      wallet: { select: { id: true, balance: true } },
    },
  });
  const catBySlug = Object.fromEntries(categoryRows.map((c) => [c.slug, c]));
  const bal = new Map(allProviders.map((p) => [p.id, p.wallet?.balance ?? 0]));
  const spent = new Map(allProviders.map((p) => [p.id, 0]));
  const discountFor = (tier: string) => (tier === "PRO" ? 20 : tier === "STARTER" ? 10 : 0);

  let histLeads = 0;
  for (let i = 0; i < 190; i++) {
    const cat = pick(categoryRows);
    const city = pick(cityRows);
    const when = new Date(Date.now() - between(0, 21) * 86400000 - between(0, 23) * 3600000);
    const lr = await db.leadRequest.create({
      data: {
        name: `${pick(FIRST)} ${pick(LAST)}`,
        phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
        message: pick([
          `Looking for ${cat.name.toLowerCase()} in ${city.name}. Please share a quote.`,
          `Need ${cat.name.toLowerCase()} this week. What are your charges?`,
          `Requirement for ${cat.name.toLowerCase()} — 2BHK, ${city.name}.`,
          `Urgent ${cat.name.toLowerCase()} needed. Are you available?`,
        ]),
        categorySlug: cat.slug,
        citySlug: city.slug,
        source: "web",
        status: "NEW",
        createdAt: when,
      },
    });
    histLeads++;

    const matches = allProviders
      .filter((p) => p.city.slug === city.slug && p.services.some((s) => s.category.slug === cat.slug))
      .slice(0, between(0, 3));
    for (const m of matches) {
      const cost = Math.max(1, Math.round(catBySlug[cat.slug].leadPrice * (1 - discountFor(m.tier) / 100)));
      const current = bal.get(m.id) ?? 0;
      if (!m.wallet || current < cost) continue;
      const after = current - cost;
      bal.set(m.id, after);
      spent.set(m.id, (spent.get(m.id) ?? 0) + cost);
      await db.lead.create({
        data: {
          leadRequestId: lr.id,
          providerId: m.id,
          creditCost: cost,
          chargedAt: when,
          status: pick(["NEW", "VIEWED", "VIEWED", "CONTACTED", "CONTACTED", "WON", "LOST"]),
          createdAt: when,
        },
      });
      await db.walletTransaction.create({
        data: {
          walletId: m.wallet.id,
          type: "LEAD_CHARGE",
          amount: -cost,
          balanceAfter: after,
          refType: "lead_request",
          refId: lr.id,
          note: `Lead in ${cat.slug}`,
          createdAt: when,
        },
      });
    }
  }
  // Write back the running balances / lifetime spend.
  for (const p of allProviders) {
    if (!p.wallet) continue;
    await db.wallet.update({
      where: { id: p.wallet.id },
      data: { balance: bal.get(p.id) ?? p.wallet.balance, lifetimeSpent: spent.get(p.id) ?? 0 },
    });
  }

  console.log(
    `Done. ${categoryRows.length} categories, ${cityRows.length} cities, ${total} providers, ${histUsers.length + 3} users, ${histLeads} historical enquiries.`,
  );
  console.log("Dev login: use any 10-digit number; the OTP is printed here and shown on the login screen.");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
