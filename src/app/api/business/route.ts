import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setSessionCookie, type Role } from "@/lib/auth";
import { providerOnboardingSchema, providerProfileSchema } from "@/lib/validation";
import { seedSampleLeads } from "@/lib/leads";
import { slugify } from "@/lib/utils";

async function uniqueSlug(base: string) {
  let slug = base;
  let n = 1;
  while (await db.provider.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const existing = await db.provider.findUnique({ where: { ownerId: user.id }, select: { slug: true } });
  if (existing) {
    return NextResponse.json({ error: "You already have a business listed", slug: existing.slug }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = providerOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form", fieldErrors: flatten(parsed.error) }, { status: 422 });
  }
  const d = parsed.data;

  const [city, category] = await Promise.all([
    db.city.findUnique({ where: { slug: d.citySlug }, include: { localities: true } }),
    db.category.findUnique({ where: { slug: d.categorySlug } }),
  ]);
  if (!city || !category) return NextResponse.json({ error: "Unknown city or service" }, { status: 422 });
  const locality = city.localities.find((l) => l.slug === d.localitySlug);
  if (!locality) return NextResponse.json({ error: "Unknown locality" }, { status: 422 });

  const slug = await uniqueSlug(`${slugify(d.name)}-${city.slug}`);

  const provider = await db.provider.create({
    data: {
      slug,
      name: d.name,
      about: d.about,
      phone: d.phone,
      email: d.email || null,
      yearsInBusiness: d.yearsInBusiness,
      addressLine: d.addressLine,
      status: "ACTIVE", // self-serve for now; admin approval + KYC gating is a later module
      kycStatus: "UNVERIFIED",
      ownerId: user.id,
      cityId: city.id,
      localityId: locality.id,
      services: {
        create: [{ categoryId: category.id, priceFrom: d.priceFrom ?? null, priceUnit: d.priceUnit || null }],
      },
    },
  });

  await db.user.update({ where: { id: user.id }, data: { role: "PROVIDER_OWNER" } });
  await setSessionCookie({ id: user.id, role: "PROVIDER_OWNER" as Role, name: user.name, phone: user.phone });

  await seedSampleLeads(provider.id, category.slug, city.slug);

  return NextResponse.json({ ok: true, slug: provider.slug }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({
    where: { ownerId: user.id },
    include: { city: { include: { localities: true } } },
  });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = providerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form", fieldErrors: flatten(parsed.error) }, { status: 422 });
  }
  const d = parsed.data;
  const locality = provider.city.localities.find((l) => l.slug === d.localitySlug);
  if (!locality) return NextResponse.json({ error: "Unknown locality" }, { status: 422 });

  await db.provider.update({
    where: { id: provider.id },
    data: {
      about: d.about,
      phone: d.phone,
      email: d.email === "" ? null : d.email ?? provider.email,
      yearsInBusiness: d.yearsInBusiness,
      addressLine: d.addressLine,
      localityId: locality.id,
    },
  });

  return NextResponse.json({ ok: true });
}

function flatten(err: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path[0];
    if (typeof k === "string" && !out[k]) out[k] = i.message;
  }
  return out;
}
