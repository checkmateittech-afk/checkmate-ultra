"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { maskPhone } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PhoneReveal({
  phone,
  className,
  size = "sm",
}: {
  phone: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [shown, setShown] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface font-semibold text-ink hover:bg-canvas",
        size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-5 text-sm",
        className,
      )}
      aria-live="polite"
    >
      <Phone size={15} className="text-brand-500" />
      {shown ? phone : `${maskPhone(phone)}  ·  Show number`}
    </button>
  );
}
