import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium leading-none",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700",
        green: "bg-emerald-50 text-emerald-700",
        neutral: "bg-canvas text-muted",
        navy: "bg-navy-700/10 text-navy-800",
        star: "bg-amber-50 text-amber-700",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-2.5 py-1 text-[13px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
