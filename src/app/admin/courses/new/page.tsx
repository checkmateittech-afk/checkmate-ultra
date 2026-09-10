import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin-guard";
import { listCourseCategories } from "@/lib/courses";
import { CourseForm } from "../course-form";

export const metadata: Metadata = { title: "Admin · New course" };

export default async function NewCoursePage() {
  await requireAdminUser();
  const categories = await listCourseCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-ink sm:text-2xl">New course</h1>
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No course categories yet. An admin can add the first one under{" "}
          <span className="font-medium text-ink">Catalog</span>, or use the “add a new category” box in the form once one exists.
        </p>
      ) : null}
      <CourseForm categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
