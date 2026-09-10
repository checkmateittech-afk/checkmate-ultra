import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Search } from "lucide-react";
import { listPublishedCourses } from "@/lib/courses";
import { siteUrl } from "@/lib/seo";
import { CourseCard } from "./course-card";

export const metadata: Metadata = {
  title: "Courses & Training Programs",
  description:
    "Explore instructor-led IT and professional training courses — business analysis, QA, cloud, data, web development and more. Job-ready curriculum, expert trainers, certificates on completion.",
  alternates: { canonical: `${siteUrl()}/courses` },
  openGraph: {
    title: "Courses & Training Programs | Checkmate",
    description:
      "Instructor-led IT and professional training — business analysis, QA, cloud, data, web development and more.",
    url: `${siteUrl()}/courses`,
    type: "website",
  },
};

export default async function CoursesIndexPage() {
  const categories = (await listPublishedCourses()).filter((c) => c.courses.length > 0);
  const total = categories.reduce((n, c) => n + c.courses.length, 0);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Courses & Training Programs",
    numberOfItems: total,
    itemListElement: categories.flatMap((cat, ci) =>
      cat.courses.map((course, i) => ({
        "@type": "ListItem",
        position: ci * 100 + i + 1,
        url: `${siteUrl()}/courses/${course.slug}`,
        name: course.title,
      })),
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-50 to-canvas">
        <div className="container-page py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-brand-700">
              <GraduationCap size={14} /> Training programs
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Courses to build job-ready skills
            </h1>
            <p className="mt-3 text-base text-muted">
              Instructor-led IT and professional training across {categories.length} tracks. Real projects,
              expert trainers, interview prep and a certificate on completion.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[200px_1fr]">
        {/* Category nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tracks</p>
            <nav className="flex flex-col gap-0.5 text-sm">
              {categories.map((c) => (
                <a
                  key={c.slug}
                  href={`#${c.slug}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface hover:text-ink"
                >
                  {c.name} <span className="text-xs">{c.courses.length}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex flex-col gap-10">
          {categories.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface p-12 text-center">
              <Search size={24} className="mx-auto text-muted" />
              <p className="mt-2 text-sm text-muted">No published courses yet — check back soon.</p>
            </div>
          )}

          {categories.map((cat) => (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">{cat.name}</h2>
                <span className="text-sm text-muted">{cat.courses.length} courses</span>
              </div>
              {cat.blurb && <p className="mt-1 text-sm text-muted">{cat.blurb}</p>}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {cat.courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="container-page pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-navy-800 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Not sure which course fits?</h3>
            <p className="mt-1 text-sm text-white/70">
              Tell us your goal and we&apos;ll recommend the right track and batch.
            </p>
          </div>
          <Link
            href="/get-quotes"
            className="shrink-0 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Talk to an advisor
          </Link>
        </div>
      </section>
    </>
  );
}
