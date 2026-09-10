import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { courseSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

const STAFF = ["ADMIN", "MODERATOR", "EDITOR"];

async function uniqueSlug(base: string) {
  let slug = base || "course";
  let n = 1;
  while (await db.course.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${++n}`;
  return slug;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !STAFF.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return NextResponse.json({ error: "Please check the form", fieldErrors }, { status: 422 });
  }
  const d = parsed.data;

  const cat = await db.courseCategory.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!cat) return NextResponse.json({ error: "Unknown category" }, { status: 422 });

  const slug = await uniqueSlug(slugify(d.title));
  const status = d.status ?? "DRAFT";

  const course = await db.course.create({
    data: {
      slug,
      title: d.title,
      subtitle: d.subtitle || null,
      categoryId: d.categoryId,
      summary: d.summary,
      overview: d.overview,
      mode: d.mode,
      level: d.level || null,
      durationText: d.durationText || null,
      feeText: d.feeText || null,
      trainerName: d.trainerName || null,
      highlights: d.highlights || "",
      curriculum: d.curriculum || "",
      prerequisites: d.prerequisites || null,
      audience: d.audience || null,
      faqJson: JSON.stringify(d.faq ?? []),
      heroTint: d.heroTint || "1f3a5f",
      status,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      ogImageUrl: d.ogImageUrl || null,
      authorId: user.id,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    select: { id: true, slug: true, status: true },
  });

  return NextResponse.json({ ok: true, course }, { status: 201 });
}
