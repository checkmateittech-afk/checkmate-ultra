import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { requireAdminUser } from "@/lib/admin-guard";
import { adminListCourses } from "@/lib/courses";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Panel, Pill } from "../_components/admin-ui";
import { FilterBar } from "../_components/filter-bar";
import { CourseRowActions } from "./course-row-actions";

export const metadata: Metadata = { title: "Admin · Courses" };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const user = await requireAdminUser();
  const sp = await searchParams;
  const { rows, categories, counts } = await adminListCourses(sp);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Courses"
        description="Course pages your team writes. Publish to make them live at /courses. Each page ships with SEO tags and Course schema."
        action={
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={15} /> New course
          </Link>
        }
      />

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>Draft <span className="font-semibold text-ink">{counts.DRAFT ?? 0}</span></span>
        <span>Published <span className="font-semibold text-ink">{counts.PUBLISHED ?? 0}</span></span>
        <span>Archived <span className="font-semibold text-ink">{counts.ARCHIVED ?? 0}</span></span>
      </div>

      <FilterBar
        searchPlaceholder="Search title, slug, summary…"
        selects={[
          { key: "status", label: "Status", options: ["DRAFT", "PUBLISHED", "ARCHIVED"].map((v) => ({ value: v, label: v })) },
          { key: "category", label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
        ]}
      />

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5 font-medium">Course</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Author</th>
                <th className="px-3 py-2.5 font-medium">Updated</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/60">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/courses/${c.id}`} className="font-medium text-ink hover:text-brand-600">
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted">/{c.slug}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{c.category.name}</td>
                  <td className="px-3 py-2.5">
                    <Pill>{c.status}</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">{c.author.name ?? c.author.phone}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{timeAgo(c.updatedAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.status === "PUBLISHED" && (
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="text-muted hover:text-brand-600"
                          title="View live"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/courses/${c.id}`}
                        className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-canvas"
                      >
                        Edit
                      </Link>
                      <CourseRowActions id={c.id} status={c.status} canDelete={user.role === "ADMIN"} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-muted">
                    No courses yet. Click <span className="font-semibold text-ink">New course</span> to write the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
