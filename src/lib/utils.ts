import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic warm gradient from a string seed — used for avatars & photo tiles. */
export function gradientFromSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 40 + (h % 40)) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 52%), hsl(${b} 68% 42%))`;
}

export function pluralize(n: number, one: string, many = one + "s") {
  return `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "••••••••";
  return `+91 ${digits.slice(-10, -8)}••• ••${digits.slice(-2)}`;
}

export function formatPrice(from: number | null | undefined, unit: string | null | undefined) {
  if (!from) return "Contact for quote";
  return `₹${from.toLocaleString("en-IN")}${unit ? ` ${unit}` : ""}`;
}

export function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
