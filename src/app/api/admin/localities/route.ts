import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const schema = z.object({
  citySlug: z.string().min(1),
  name: z.string().trim().min(2).max(60),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a locality name" }, { status: 422 });

  const city = await db.city.findUnique({ where: { slug: parsed.data.citySlug }, select: { id: true } });
  if (!city) return NextResponse.json({ error: "Unknown city" }, { status: 404 });

  const slug = slugify(parsed.data.name);
  const exists = await db.locality.findUnique({ where: { cityId_slug: { cityId: city.id, slug } } });
  if (exists) return NextResponse.json({ error: "That locality already exists" }, { status: 409 });

  const locality = await db.locality.create({
    data: { cityId: city.id, name: parsed.data.name, slug },
  });
  return NextResponse.json({ ok: true, locality: { id: locality.id, name: locality.name, slug: locality.slug } });
}
