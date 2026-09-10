import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { courseSchema } from "@/lib/validation";

const FULL_STAFF = ["ADMIN", "MODERATOR"];

async function loadAndAuthorize(id: string) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "MODERATOR", "EDITOR"].includes(user.role)) return { error: "Forbidden", status: 403 as const };
  const course = await db.course.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
  if (!course) return { error: "Course not found", status: 404 as const };
  const canEdit = FULL_STAFF.includes(user.role) || course.authorId === user.id;
  if (!canEdit) return { error: "You can only edit your own courses", status: 403 as const };
  return { user, course };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await loadAndAuthorize(id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = courseSchema.partial().safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return NextResponse.json({ error: "Please check the form", fieldErrors }, { status: 422 });
  }
  const d = parsed.data;

  if (d.categoryId) {
    const cat = await db.courseCategory.findUnique({ where: { id: d.categoryId }, select: { id: true } });
    if (!cat) return NextResponse.json({ error: "Unknown category" }, { status: 422 });
  }

  const data: Record<string, unknown> = {};
  const strFields = [
    "title",
    "subtitle",
    "categoryId",
    "summary",
    "overview",
    "mode",
    "level",
    "durationText",
    "feeText",
    "trainerName",
    "highlights",
    "curriculum",
    "prerequisites",
    "audience",
    "heroTint",
    "metaTitle",
    "metaDescription",
    "ogImageUrl",
  ] as const;
  for (const f of strFields) {
    if (d[f] !== undefined) {
      const v = d[f];
      data[f] = v === "" && !["title", "summary", "overview", "mode", "categoryId", "highlights", "curriculum", "heroTint"].includes(f) ? null : v;
    }
  }
  if (d.faq !== undefined) data.faqJson = JSON.stringify(d.faq);
  if (d.status !== undefined) {
    data.status = d.status;
    if (d.status === "PUBLISHED" && auth.course.status !== "PUBLISHED") data.publishedAt = new Date();
  }

  const course = await db.course.update({
    where: { id },
    data,
    select: { id: true, slug: true, status: true },
  });
  return NextResponse.json({ ok: true, course });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await loadAndAuthorize(id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await db.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
