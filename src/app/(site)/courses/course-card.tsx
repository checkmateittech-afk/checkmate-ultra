import Link from "next/link";
import { Clock, MonitorPlay, IndianRupee, ArrowRight } from "lucide-react";
import { MODE_LABEL } from "@/lib/courses";

export type CourseCardData = {
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  mode: string;
  level: string | null;
  durationText: string | null;
  feeText: string | null;
  heroTint: string;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-brand-300 hover:shadow-sm"
    >
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, #${course.heroTint}, #${course.heroTint}99)` }}
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-ink group-hover:text-brand-700">{course.title}</h3>
        {course.subtitle && <p className="mt-0.5 text-xs text-muted">{course.subtitle}</p>}
        <p className="mt-2 line-clamp-2 text-sm text-muted">{course.summary}</p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MonitorPlay size={13} /> {MODE_LABEL[course.mode] ?? course.mode}
          </span>
          {course.durationText && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {course.durationText}
            </span>
          )}
          {course.feeText && (
            <span className="inline-flex items-center gap-1">
              <IndianRupee size={12} /> {course.feeText}
            </span>
          )}
        </div>

        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          View details <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
