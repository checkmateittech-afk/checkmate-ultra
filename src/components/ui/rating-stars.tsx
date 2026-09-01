import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-star" strokeWidth={1.5} />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="text-star fill-star" strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function RatingInline({ value, count }: { value: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-semibold text-white">
        {value.toFixed(1)}
        <Star size={12} className="fill-white" strokeWidth={0} />
      </span>
      <span className="text-muted">
        {count.toLocaleString("en-IN")} {count === 1 ? "review" : "reviews"}
      </span>
    </span>
  );
}
