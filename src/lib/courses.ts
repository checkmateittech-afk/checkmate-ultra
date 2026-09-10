import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type Faq = { q: string; a: string };

export function parseFaq(json: string): Faq[] {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) {
      return v
        .filter((x) => x && typeof x.q === "string" && typeof x.a === "string")
        .map((x) => ({ q: String(x.q), a: String(x.a) }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function toLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export const MODE_LABEL: Record<string, string> = {
  ONLINE: "Live online",
  CLASSROOM: "Classroom",
  HYBRID: "Hybrid",
};

// ---------- public ----------

export async function listPublishedCourses() {
  return db.courseCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      courses: {
        where: { status: "PUBLISHED" },
        orderBy: { title: "asc" },
        select: {
          slug: true,
          title: true,
          subtitle: true,
          summary: true,
          mode: true,
          level: true,
          durationText: true,
          feeText: true,
          trainerName: true,
          heroTint: true,
        },
      },
    },
  });
}

export async function getPublicCourse(slug: string, includeUnpublished = false) {
  return db.course.findFirst({
    where: { slug, ...(includeUnpublished ? {} : { status: "PUBLISHED" }) },
    include: { category: true, author: { select: { name: true } } },
  });
}

export async function publishedCourseSlugs() {
  return db.course.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
}

// ---------- admin ----------

export async function adminListCourses(f: { q?: string; status?: string; category?: string } = {}) {
  const where: Prisma.CourseWhereInput = {
    status: f.status || undefined,
    category: f.category ? { slug: f.category } : undefined,
  };
  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = [{ title: { contains: q } }, { slug: { contains: q } }, { summary: { contains: q } }];
  }
  const [rows, categories, counts] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { category: { select: { name: true, slug: true } }, author: { select: { name: true, phone: true } } },
    }),
    db.courseCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.course.groupBy({ by: ["status"], _count: true }),
  ]);
  return { rows, categories, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) };
}

export async function getCourseForEdit(id: string) {
  return db.course.findUnique({ where: { id }, include: { category: true } });
}

export async function listCourseCategories() {
  return db.courseCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { courses: true } } },
  });
}

// ---------- team ----------

export async function adminListTeam() {
  return db.user.findMany({
    where: { role: { in: ["EDITOR", "MODERATOR", "ADMIN"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { courses: true } } },
  });
}
