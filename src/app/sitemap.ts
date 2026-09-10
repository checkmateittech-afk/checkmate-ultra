import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, categories, cities] = await Promise.all([
    db.course.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.city.findMany({ select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/courses"), changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/search"), changeFrequency: "weekly", priority: 0.5 },
    { url: siteUrl("/get-quotes"), changeFrequency: "monthly", priority: 0.4 },
  ];

  const coursePages: MetadataRoute.Sitemap = courses.map((c) => ({
    url: siteUrl(`/courses/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((cat) => [
    { url: siteUrl(`/${cat.slug}`), changeFrequency: "weekly", priority: 0.6 },
    ...cities.map((city) => ({
      url: siteUrl(`/${cat.slug}/${city.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ]);

  return [...staticPages, ...coursePages, ...categoryPages];
}
