import "server-only";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import type { Prisma } from "@prisma/client";

const DAY = 86_400_000;
const now = () => Date.now();
const ago = (ms: number) => new Date(now() - ms);

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Bucket a list of dates into the last `n` day counts, oldest first. */
function byDay(dates: Date[], n: number) {
  const today = startOfDay();
  const buckets = Array.from({ length: n }, (_, i) => {
    const day = new Date(today.getTime() - (n - 1 - i) * DAY);
    return { label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), day, count: 0 };
  });
  for (const d of dates) {
    const idx = Math.floor((startOfDay(d).getTime() - buckets[0].day.getTime()) / DAY);
    if (idx >= 0 && idx < n) buckets[idx].count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

function byWeek(dates: Date[], weeks: number) {
  const anchor = startOfDay();
  anchor.setDate(anchor.getDate() - anchor.getDay()); // start of this week (Sun)
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(anchor.getTime() - (weeks - 1 - i) * 7 * DAY);
    return { label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), start, count: 0 };
  });
  for (const d of dates) {
    const idx = Math.floor((d.getTime() - buckets[0].start.getTime()) / (7 * DAY));
    if (idx >= 0 && idx < weeks) buckets[idx].count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

export async function adminDashboard() {
  const [
    providers,
    users,
    leadReqTotal,
    leadReq24,
    leadReq7,
    leadReq30,
    leadRows,
    reviewRows,
    wallets,
    txns,
    subs,
    recentLeadReq,
    recentReviews,
    recentKyc,
    recentUsers,
    recentSubs,
    leadReqDates,
    userDates,
    providerDates,
    catGroups,
    cityRows,
    leadByProvider,
    topRated,
  ] = await Promise.all([
    db.provider.findMany({ select: { status: true, verified: true, tier: true, kycStatus: true } }),
    db.user.findMany({ select: { role: true, status: true } }),
    db.leadRequest.count(),
    db.leadRequest.count({ where: { createdAt: { gte: ago(DAY) } } }),
    db.leadRequest.count({ where: { createdAt: { gte: ago(7 * DAY) } } }),
    db.leadRequest.count({ where: { createdAt: { gte: ago(30 * DAY) } } }),
    db.lead.findMany({ select: { status: true, creditCost: true } }),
    db.review.findMany({ select: { status: true, rating: true } }),
    db.wallet.findMany({ select: { balance: true } }),
    db.walletTransaction.groupBy({ by: ["type"], _sum: { amount: true }, _count: true }),
    db.subscription.findMany({ where: { status: "ACTIVE" }, select: { planSlug: true } }),
    db.leadRequest.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, categorySlug: true, citySlug: true, createdAt: true } }),
    db.review.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { provider: { select: { name: true, slug: true } } } }),
    db.kycSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { provider: { select: { name: true, slug: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, phone: true, role: true, createdAt: true } }),
    db.subscription.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: { provider: { select: { name: true, slug: true } } } }),
    db.leadRequest.findMany({ where: { createdAt: { gte: ago(14 * DAY) } }, select: { createdAt: true } }),
    db.user.findMany({ where: { createdAt: { gte: ago(56 * DAY) } }, select: { createdAt: true } }),
    db.provider.findMany({ where: { createdAt: { gte: ago(56 * DAY) } }, select: { createdAt: true } }),
    db.leadRequest.groupBy({ by: ["categorySlug"], _count: true }),
    db.city.findMany({ select: { name: true, slug: true, _count: { select: { providers: true } } } }),
    db.lead.groupBy({ by: ["providerId"], _count: { _all: true }, _sum: { creditCost: true }, orderBy: { _count: { providerId: "desc" } }, take: 8 }),
    db.provider.findMany({ where: { ratingCount: { gte: 3 }, status: "ACTIVE" }, orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }], take: 6, select: { name: true, slug: true, ratingAvg: true, ratingCount: true, city: { select: { name: true } } } }),
  ]);

  const count = <T extends string>(rows: { [k: string]: unknown }[], key: string) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      const v = String(r[key] ?? "—") as T;
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  const providerStatus = count(providers, "status");
  const providerTier = count(providers, "tier");
  const userRole = count(users, "role");

  const txnSum = (type: string) => txns.find((t) => t.type === type)?._sum.amount ?? 0;
  const creditsInCirculation = wallets.reduce((s, w) => s + w.balance, 0);
  const creditsSold = txnSum("TOPUP");
  const creditsGranted = txnSum("BONUS") + txnSum("PLAN_GRANT") + Math.max(0, txnSum("ADJUSTMENT"));
  const creditsSpent = Math.abs(txnSum("LEAD_CHARGE"));
  const creditsRefunded = txnSum("REFUND");

  const mrr = subs.reduce((s, sub) => s + (PLANS.find((p) => p.slug === sub.planSlug)?.priceInr ?? 0), 0);

  const categories = await db.category.findMany({ select: { slug: true, name: true, leadPrice: true, _count: { select: { services: true } } } });
  const topCategories = categories
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      providers: c._count.services,
      leads: catGroups.find((g) => g.categorySlug === c.slug)?._count ?? 0,
      leadPrice: c.leadPrice,
    }))
    .sort((a, b) => b.leads - a.leads);

  const topCities = cityRows
    .map((c) => ({ name: c.name, slug: c.slug, providers: c._count.providers }))
    .sort((a, b) => b.providers - a.providers);

  const providerNames = await db.provider.findMany({
    where: { id: { in: leadByProvider.map((g) => g.providerId) } },
    select: { id: true, name: true, slug: true },
  });
  const topProvidersByLeads = leadByProvider.map((g) => ({
    slug: providerNames.find((p) => p.id === g.providerId)?.slug ?? "",
    name: providerNames.find((p) => p.id === g.providerId)?.name ?? "Unknown",
    leads: g._count._all,
    creditsEarned: g._sum.creditCost ?? 0,
  }));

  type Activity = { kind: string; when: Date; title: string; sub: string; href?: string };
  const activity: Activity[] = [
    ...recentLeadReq.map((l) => ({
      kind: "lead",
      when: l.createdAt,
      title: `New enquiry from ${l.name}`,
      sub: [l.categorySlug?.replace(/-/g, " "), l.citySlug].filter(Boolean).join(" · ") || "general",
    })),
    ...recentReviews.map((r) => ({
      kind: "review",
      when: r.createdAt,
      title: `${r.rating}★ review on ${r.provider.name}`,
      sub: r.status,
      href: `/business/${r.provider.slug}`,
    })),
    ...recentKyc.map((k) => ({
      kind: "kyc",
      when: k.createdAt,
      title: `KYC ${k.status.toLowerCase()} — ${k.provider.name}`,
      sub: `${k.docType} · ${k.docRef}`,
      href: `/business/${k.provider.slug}`,
    })),
    ...recentUsers.map((u) => ({
      kind: "user",
      when: u.createdAt,
      title: `${u.name ?? "New user"} signed up`,
      sub: `${u.phone} · ${u.role}`,
    })),
    ...recentSubs.map((s) => ({
      kind: "plan",
      when: s.updatedAt,
      title: `${s.provider.name} on ${s.planSlug}`,
      sub: s.status,
      href: `/business/${s.provider.slug}`,
    })),
  ]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 18);

  return {
    providers: {
      total: providers.length,
      active: providerStatus.ACTIVE ?? 0,
      pending: providerStatus.PENDING ?? 0,
      suspended: providerStatus.SUSPENDED ?? 0,
      verified: providers.filter((p) => p.verified).length,
      byTier: { FREE: providerTier.FREE ?? 0, STARTER: providerTier.STARTER ?? 0, PRO: providerTier.PRO ?? 0 },
    },
    users: {
      total: users.length,
      suspended: users.filter((u) => u.status !== "ACTIVE").length,
      byRole: userRole,
    },
    leads: {
      total: leadReqTotal,
      last24h: leadReq24,
      last7d: leadReq7,
      last30d: leadReq30,
      deliveredRows: leadRows.length,
      won: leadRows.filter((l) => l.status === "WON").length,
      avgFanout: leadReqTotal ? Math.round((leadRows.length / leadReqTotal) * 10) / 10 : 0,
    },
    reviews: {
      total: reviewRows.length,
      published: reviewRows.filter((r) => r.status === "PUBLISHED").length,
      hidden: reviewRows.filter((r) => r.status === "HIDDEN").length,
      pending: reviewRows.filter((r) => r.status === "PENDING").length,
      avgRating: reviewRows.length
        ? Math.round((reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length) * 10) / 10
        : 0,
    },
    credits: { creditsInCirculation, creditsSold, creditsGranted, creditsSpent, creditsRefunded },
    mrr,
    queues: {
      kycPending: providers.filter((p) => p.kycStatus === "SUBMITTED").length,
      reviewsHidden: reviewRows.filter((r) => r.status === "HIDDEN").length,
      providersSuspended: providerStatus.SUSPENDED ?? 0,
      providersPending: providerStatus.PENDING ?? 0,
      zeroCreditProviders: wallets.filter((w) => w.balance <= 0).length,
    },
    charts: {
      leadsByDay: byDay(leadReqDates.map((r) => r.createdAt), 14),
      signupsByWeek: byWeek(userDates.map((r) => r.createdAt), 8),
      providersByWeek: byWeek(providerDates.map((r) => r.createdAt), 8),
    },
    topCategories,
    topCities,
    topProvidersByLeads,
    topRated: topRated.map((p) => ({ name: p.name, slug: p.slug, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, city: p.city.name })),
    activity,
  };
}

// ---------- Providers ----------

export type ProviderFilter = { q?: string; status?: string; kyc?: string; tier?: string; sort?: string };

export async function adminProviders(f: ProviderFilter = {}) {
  const where: Prisma.ProviderWhereInput = {
    status: f.status || undefined,
    kycStatus: f.kyc || undefined,
    tier: f.tier || undefined,
  };
  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { slug: { contains: q } },
      { owner: { phone: { contains: q } } },
    ];
  }

  const orderBy: Prisma.ProviderOrderByWithRelationInput =
    f.sort === "rating"
      ? { ratingAvg: "desc" }
      : f.sort === "oldest"
        ? { createdAt: "asc" }
        : f.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const rows = await db.provider.findMany({
    where,
    orderBy,
    take: 200,
    include: {
      city: { select: { name: true } },
      locality: { select: { name: true } },
      services: { select: { category: { select: { name: true } } } },
      kycSubmissions: { orderBy: { createdAt: "desc" }, take: 1 },
      owner: { select: { phone: true, name: true } },
      wallet: { select: { balance: true } },
      _count: { select: { leads: true, reviews: true } },
    },
  });

  const summary = await db.provider.groupBy({ by: ["status"], _count: true });
  return { rows, summary: Object.fromEntries(summary.map((s) => [s.status, s._count])) };
}

// ---------- Users ----------

export type UserFilter = { q?: string; role?: string; status?: string };

export async function adminUsers(f: UserFilter = {}) {
  const where: Prisma.UserWhereInput = {
    role: f.role || undefined,
    status: f.status || undefined,
  };
  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }];
  }
  const rows = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      provider: { select: { name: true, slug: true, status: true } },
      _count: { select: { leads: true, reviews: true } },
    },
  });
  const summary = await db.user.groupBy({ by: ["role"], _count: true });
  return { rows, summary: Object.fromEntries(summary.map((s) => [s.role, s._count])) };
}

// ---------- Leads ----------

export type LeadFilter = { q?: string; category?: string; city?: string; source?: string };

export async function adminLeads(f: LeadFilter = {}) {
  const where: Prisma.LeadRequestWhereInput = {
    categorySlug: f.category || undefined,
    citySlug: f.city || undefined,
    source: f.source || undefined,
  };
  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = [{ name: { contains: q } }, { phone: { contains: q } }, { message: { contains: q } }];
  }
  const rows = await db.leadRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      user: { select: { name: true, phone: true } },
      leads: { select: { status: true, creditCost: true, provider: { select: { name: true } } } },
    },
  });
  return rows;
}

// ---------- Reviews ----------

export async function adminReviews(f: { q?: string; status?: string; rating?: string } = {}) {
  const where: Prisma.ReviewWhereInput = {
    status: f.status || undefined,
    rating: f.rating ? Number(f.rating) : undefined,
  };
  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = [{ title: { contains: q } }, { body: { contains: q } }, { authorName: { contains: q } }];
  }
  return db.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { provider: { select: { name: true, slug: true } } },
  });
}

// ---------- Finance ----------

export async function adminFinance(typeFilter?: string) {
  const [byType, topWallets, lowWallets, ledger, walletCount] = await Promise.all([
    db.walletTransaction.groupBy({ by: ["type"], _sum: { amount: true }, _count: true }),
    db.wallet.findMany({ orderBy: { balance: "desc" }, take: 10, include: { provider: { select: { name: true, slug: true, tier: true } } } }),
    db.wallet.findMany({ orderBy: { balance: "asc" }, take: 10, include: { provider: { select: { name: true, slug: true, tier: true } } } }),
    db.walletTransaction.findMany({
      where: typeFilter ? { type: typeFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { wallet: { select: { provider: { select: { name: true, slug: true } } } } },
    }),
    db.wallet.count(),
  ]);
  const sum = (t: string) => byType.find((b) => b.type === t)?._sum.amount ?? 0;
  return {
    totals: {
      inCirculation: (await db.wallet.aggregate({ _sum: { balance: true } }))._sum.balance ?? 0,
      lifetimeSpent: (await db.wallet.aggregate({ _sum: { lifetimeSpent: true } }))._sum.lifetimeSpent ?? 0,
      sold: sum("TOPUP"),
      granted: sum("BONUS") + sum("PLAN_GRANT"),
      adjustments: sum("ADJUSTMENT"),
      leadCharges: Math.abs(sum("LEAD_CHARGE")),
      refunds: sum("REFUND"),
      walletCount,
    },
    byType: byType.map((b) => ({ type: b.type, sum: b._sum.amount ?? 0, count: b._count })),
    topWallets,
    lowWallets,
    ledger,
  };
}

// ---------- Activity ----------

export type ActivityRow = { kind: string; when: Date; title: string; sub: string; href?: string };

export async function adminActivity(kind?: string, take = 80): Promise<ActivityRow[]> {
  const want = (k: string) => !kind || kind === k;
  const rows: ActivityRow[] = [];

  if (want("lead")) {
    const leads = await db.leadRequest.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { name: true, phone: true, categorySlug: true, citySlug: true, source: true, createdAt: true, _count: { select: { leads: true } } },
    });
    rows.push(
      ...leads.map((l) => ({
        kind: "lead",
        when: l.createdAt,
        title: `Enquiry from ${l.name} (${l.phone})`,
        sub: `${[l.categorySlug?.replace(/-/g, " "), l.citySlug].filter(Boolean).join(" · ") || "general"} — ${l._count.leads} delivered${l.source !== "web" ? ` · ${l.source}` : ""}`,
      })),
    );
  }
  if (want("review")) {
    const reviews = await db.review.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { provider: { select: { name: true, slug: true } } },
    });
    rows.push(
      ...reviews.map((r) => ({
        kind: "review",
        when: r.createdAt,
        title: `${r.rating}★ "${r.title}" on ${r.provider.name}`,
        sub: `by ${r.authorName} · ${r.status}`,
        href: `/business/${r.provider.slug}`,
      })),
    );
  }
  if (want("kyc")) {
    const kyc = await db.kycSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { provider: { select: { name: true, slug: true } } },
    });
    rows.push(
      ...kyc.map((k) => ({
        kind: "kyc",
        when: k.createdAt,
        title: `KYC ${k.status.toLowerCase()} — ${k.provider.name}`,
        sub: `${k.docType} · ${k.docRef}`,
        href: `/business/${k.provider.slug}`,
      })),
    );
  }
  if (want("user")) {
    const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take, select: { name: true, phone: true, role: true, createdAt: true } });
    rows.push(
      ...users.map((u) => ({
        kind: "user",
        when: u.createdAt,
        title: `${u.name ?? "New user"} signed up`,
        sub: `${u.phone} · ${u.role}`,
      })),
    );
  }
  if (want("credit")) {
    const txns = await db.walletTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { wallet: { select: { provider: { select: { name: true, slug: true } } } } },
    });
    rows.push(
      ...txns.map((t) => ({
        kind: "credit",
        when: t.createdAt,
        title: `${t.type} ${t.amount >= 0 ? "+" : ""}${t.amount} — ${t.wallet.provider.name}`,
        sub: t.note ?? `balance ${t.balanceAfter}`,
        href: `/business/${t.wallet.provider.slug}`,
      })),
    );
  }

  return rows.sort((a, b) => b.when.getTime() - a.when.getTime()).slice(0, take);
}

// ---------- Catalog ----------

export async function adminCatalog() {
  const [categories, cities] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true } } },
    }),
    db.city.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { providers: true, localities: true } },
        localities: {
          orderBy: { name: "asc" },
          include: { _count: { select: { providers: true } } },
        },
      },
    }),
  ]);
  return { categories, cities };
}
