import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="text-sm font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  default: "text-ink",
  brand: "text-brand-600",
  ok: "text-emerald-600",
  warn: "text-amber-600",
  danger: "text-red-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sub,
  delta,
  href,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof TONE;
  sub?: string;
  delta?: number;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {Icon && <Icon size={15} className="text-muted" />}
      </div>
      <p className={cn("mt-2 text-2xl font-extrabold tabular-nums", TONE[tone])}>
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              delta > 0 ? "text-emerald-600" : "text-red-600",
            )}
          >
            {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}
          </span>
        )}
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
    </>
  );
  const cls = "block rounded-xl border border-line bg-surface p-4 transition";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-brand-300 hover:shadow-sm")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const PILL_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  WON: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUBMITTED: "bg-amber-50 text-amber-700",
  NEW: "bg-brand-50 text-brand-700",
  VIEWED: "bg-canvas text-muted",
  CONTACTED: "bg-blue-50 text-blue-700",
  SUSPENDED: "bg-red-50 text-red-700",
  HIDDEN: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
  LOST: "bg-red-50 text-red-700",
  UNVERIFIED: "bg-canvas text-muted",
  CANCELLED: "bg-canvas text-muted",
  ADMIN: "bg-brand-50 text-brand-700",
  MODERATOR: "bg-blue-50 text-blue-700",
  PROVIDER_OWNER: "bg-emerald-50 text-emerald-700",
  PROVIDER_STAFF: "bg-emerald-50 text-emerald-700",
  CONSUMER: "bg-canvas text-muted",
  PRO: "bg-brand-50 text-brand-700",
  STARTER: "bg-blue-50 text-blue-700",
  FREE: "bg-canvas text-muted",
};

export function Pill({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PILL_TONE[children] ?? "bg-canvas text-muted",
        className,
      )}
    >
      {children.replace(/_/g, " ")}
    </span>
  );
}

/** Pure-SVG bar chart, safe in a server component. */
export function BarChart({
  data,
  height = 120,
  tone = "#f2620f",
}: {
  data: { label: string; count: number }[];
  height?: number;
  tone?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.count / max) * (height - 16);
          return (
            <g key={i}>
              <rect
                x={i * w + w * 0.15}
                y={height - h - 4}
                width={w * 0.7}
                height={Math.max(h, d.count > 0 ? 2 : 0)}
                rx={1}
                fill={tone}
                opacity={0.85}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function MiniBars({ segments }: { segments: { label: string; value: number; className: string }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas">
        {segments.map((s) => (
          <div key={s.label} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-2 rounded-full", s.className)} />
            {s.label} <span className="font-semibold text-ink">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function DataCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}
