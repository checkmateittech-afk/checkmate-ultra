import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-guard";
import { getCourseForEdit, listCourseCategories } from "@/lib/courses";
import { parseFaq } from "@/lib/courses";
import { CourseForm } from "../course-form";

export const metadata: Metadata = { title: "Admin · Edit course" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();
  const { id } = await params;
  const [course, categories] = await Promise.all([getCourseForEdit(id), listCourseCategories()]);
  if (!course) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-ink sm:text-2xl">Edit course</h1>
      <CourseForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        initial={{
          id: course.id,
          slug: course.slug,
          status: course.status,
          title: course.title,
          subtitle: course.subtitle ?? "",
          categoryId: course.categoryId,
          summary: course.summary,
          overview: course.overview,
          mode: course.mode,
          level: course.level ?? "",
          durationText: course.durationText ?? "",
          feeText: course.feeText ?? "",
          trainerName: course.trainerName ?? "",
          highlights: course.highlights,
          curriculum: course.curriculum,
          prerequisites: course.prerequisites ?? "",
          audience: course.audience ?? "",
          faq: parseFaq(course.faqJson),
          heroTint: course.heroTint,
          metaTitle: course.metaTitle ?? "",
          metaDescription: course.metaDescription ?? "",
          ogImageUrl: course.ogImageUrl ?? "",
        }}
      />
    </div>
  );
}
