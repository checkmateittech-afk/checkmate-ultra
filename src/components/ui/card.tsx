import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function Avatar({
  name,
  gradient,
  size = 56,
  className,
}: {
  name: string;
  gradient: string;
  size?: number;
  className?: string;
}) {
  const label = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, backgroundImage: gradient, fontSize: size * 0.34 }}
      aria-hidden
    >
      {label}
    </span>
  );
}
