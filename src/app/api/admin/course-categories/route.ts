import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { courseCategorySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MODERATOR", "EDITOR"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = courseCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a category name" }, { status: 422 });

  const slug = slugify(parsed.data.name);
  const exists = await db.courseCategory.findUnique({ where: { slug }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "That category already exists" }, { status: 409 });

  const count = await db.courseCategory.count();
  const category = await db.courseCategory.create({
    data: { name: parsed.data.name, slug, blurb: parsed.data.blurb || null, sortOrder: count },
  });
  return NextResponse.json({ ok: true, category: { id: category.id, name: category.name, slug: category.slug } });
}
