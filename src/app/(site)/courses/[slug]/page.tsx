import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MonitorPlay, IndianRupee, BarChart3, UserRound, CheckCircle2, ChevronRight } from "lucide-react";
import { getPublicCourse, parseFaq, toLines, MODE_LABEL } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth";
import { siteUrl, ORG_NAME } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { FaqAccordion } from "./faq-accordion";

type PP = Promise<{ slug: string }>;

async function load(slug: string) {
  const staff = await getCurrentUser();
  const canPreview = staff && ["ADMIN", "MODERATOR", "EDITOR"].includes(staff.role);
  const course = await getPublicCourse(slug, Boolean(canPreview));
  return { course, isPreview: Boolean(course && course.status !== "PUBLISHED") };
}

export async function generateMetadata({ params }: { params: PP }): Promise<Metadata> {
  const { slug } = await params;
  const { course } = await load(slug);
  if (!course) return {};
  const title = course.metaTitle || `${course.title} — ${course.category.name}`;
  const description = course.metaDescription || course.summary;
  const url = `${siteUrl()}/courses/${course.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: course.ogImageUrl ? [{ url: course.ogImageUrl }] : undefined,
    },
    twitter: { card: course.ogImageUrl ? "summary_large_image" : "summary", title, description },
    robots: course.status === "PUBLISHED" ? undefined : { index: false, follow: false },
  };
}

function feeToOffer(feeText: string | null) {
  if (!feeText) return undefined;
  if (/free/i.test(feeText)) return { "@type": "Offer", price: 0, priceCurrency: "INR", category: "Free" };
  const n = Number(feeText.replace(/[^0-9.]/g, ""));
  if (!n) return undefined;
  return { "@type": "Offer", price: n, priceCurrency: "INR" };
}

export default async function CoursePage({ params }: { params: PP }) {
  const { slug } = await params;
  const { course, isPreview } = await load(slug);
  if (!course) notFound();

  const highlights = toLines(course.highlights);
  const curriculum = toLines(course.curriculum);
  const faqs = parseFaq(course.faqJson);
  const url = `${siteUrl()}/courses/${course.slug}`;

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url,
    provider: { "@type": "Organization", name: ORG_NAME, url: siteUrl() },
    ...(course.ogImageUrl ? { image: course.ogImageUrl } : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.mode === "CLASSROOM" ? "Onsite" : course.mode === "HYBRID" ? "Blended" : "Online",
      ...(course.durationText ? { courseWorkload: course.durationText } : {}),
      ...(course.trainerName
        ? { instructor: { "@type": "Person", name: course.trainerName } }
        : {}),
    },
    ...(feeToOffer(course.feeText) ? { offers: feeToOffer(course.feeText) } : {}),
    ...(course.level ? { educationalLevel: course.level } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Courses", item: `${siteUrl()}/courses` },
      { "@type": "ListItem", position: 3, name: course.category.name, item: `${siteUrl()}/courses#${course.category.slug}` },
      { "@type": "ListItem", position: 4, name: course.title, item: url },
    ],
  };

  const faqLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      {isPreview && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          Preview — this course is <b>{course.status}</b> and not visible to the public.
        </div>
      )}

      {/* Hero */}
      <section
        className="text-white"
        style={{ background: `linear-gradient(135deg, #${course.heroTint}, #${course.heroTint}cc)` }}
      >
        <div className="container-page py-10 sm:py-12">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={13} />
            <Link href="/courses" className="hover:text-white">Courses</Link>
            <ChevronRight size={13} />
            <Link href={`/courses#${course.category.slug}`} className="hover:text-white">{course.category.name}</Link>
          </nav>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="mt-2 max-w-2xl text-white/80">{course.subtitle}</p>}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <MonitorPlay size={15} /> {MODE_LABEL[course.mode] ?? course.mode}
            </span>
            {course.durationText && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} /> {course.durationText}
              </span>
            )}
            {course.level && (
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 size={15} /> {course.level}
              </span>
            )}
            {course.feeText && (
              <span className="inline-flex items-center gap-1.5">
                <IndianRupee size={14} /> {course.feeText}
              </span>
            )}
            {course.trainerName && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} /> {course.trainerName}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <article className="min-w-0">
          <Breadcrumbs
            items={[
              { label: "Courses", href: "/courses" },
              { label: course.category.name, href: `/courses#${course.category.slug}` },
              { label: course.title },
            ]}
          />

          <section className="prose-narrow mt-5">
            <h2 className="text-lg font-bold text-ink">Overview</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
              {course.overview.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {highlights.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink">What you&apos;ll learn</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {curriculum.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink">Curriculum</h2>
              <ol className="mt-3 space-y-2">
                {curriculum.map((m, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-line bg-surface p-3 text-sm">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="text-ink">{m}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(course.audience || course.prerequisites) && (
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              {course.audience && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="text-sm font-bold text-ink">Who it&apos;s for</h3>
                  <p className="mt-1 text-sm text-muted">{course.audience}</p>
                </div>
              )}
              {course.prerequisites && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="text-sm font-bold text-ink">Prerequisites</h3>
                  <p className="mt-1 text-sm text-muted">{course.prerequisites}</p>
                </div>
              )}
            </section>
          )}

          {faqs.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink">Frequently asked questions</h2>
              <div className="mt-3">
                <FaqAccordion items={faqs} />
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Enquire about this course</h2>
            <div className="mt-4">
              <EnquiryForm subject={course.title} ctaLabel="Send enquiry" />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-5 text-sm">
            <h3 className="font-semibold text-ink">Quick facts</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <Fact k="Mode" v={MODE_LABEL[course.mode] ?? course.mode} />
              {course.durationText && <Fact k="Duration" v={course.durationText} />}
              {course.level && <Fact k="Level" v={course.level} />}
              {course.feeText && <Fact k="Fee" v={course.feeText} />}
              {course.trainerName && <Fact k="Trainer" v={course.trainerName} />}
              <Fact k="Category" v={course.category.name} />
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-ink/70">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}
