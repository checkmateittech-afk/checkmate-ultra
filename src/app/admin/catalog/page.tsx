import type { Metadata } from "next";
import { adminCatalog } from "@/lib/admin";
import { PageHeader, Panel } from "../_components/admin-ui";
import { CategoryEditor } from "./category-editor";
import { LocalityManager } from "./locality-manager";

export const metadata: Metadata = { title: "Admin · Catalog" };

export default async function AdminCatalogPage() {
  const { categories, cities } = await adminCatalog();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Catalog"
        description="Service categories and their per-lead price, plus cities and localities. Prices are in credits."
      />

      <Panel title={`Categories (${categories.length})`} bodyClassName="p-0">
        <CategoryEditor
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            blurb: c.blurb,
            leadPrice: c.leadPrice,
            providers: c._count.services,
          }))}
        />
      </Panel>

      <Panel title={`Cities (${cities.length})`} bodyClassName="p-0">
        <LocalityManager
          cities={cities.map((c) => ({
            slug: c.slug,
            name: c.name,
            state: c.state,
            providers: c._count.providers,
            localities: c.localities.map((l) => ({
              id: l.id,
              name: l.name,
              slug: l.slug,
              providers: l._count.providers,
            })),
          }))}
        />
      </Panel>
    </div>
  );
}
