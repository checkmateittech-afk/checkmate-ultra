import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listCategories } from "@/lib/queries";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "List your business" };

export default async function BusinessJoinPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/join");

  const owned = await db.provider.findUnique({ where: { ownerId: user.id }, select: { slug: true } });
  if (owned) redirect("/dashboard");

  const [categories, cities] = await Promise.all([
    listCategories(),
    db.city.findMany({
      orderBy: { name: "asc" },
      include: { localities: { orderBy: { name: "asc" } } },
    }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">List your business on Checkmate</h1>
        <p className="mt-2 text-sm text-muted">
          Get discovered by customers searching for your services and receive enquiries directly.
          Free to list — takes about 3 minutes.
        </p>
        <div className="mt-6">
          <OnboardingWizard
            categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            cities={cities.map((c) => ({
              slug: c.slug,
              name: c.name,
              localities: c.localities.map((l) => ({ slug: l.slug, name: l.name })),
            }))}
            defaultName={user.name ?? ""}
            defaultPhone={user.phone.replace(/^\+91/, "")}
          />
        </div>
      </div>
    </div>
  );
}
