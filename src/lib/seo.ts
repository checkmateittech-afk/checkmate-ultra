export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return path ? `${base}${path.startsWith("/") ? "" : "/"}${path}` : base;
}
