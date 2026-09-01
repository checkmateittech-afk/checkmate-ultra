import { redirect, notFound } from "next/navigation";
import { getCategory, resolveCitySlug } from "@/lib/queries";

export default async function CategoryIndex({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) notFound();
  const city = await resolveCitySlug();
  redirect(`/${cat.slug}/${city}`);
}
