import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "My account" };

const ROLE_LABEL: Record<string, string> = {
  CONSUMER: "Member",
  PROVIDER_OWNER: "Business owner",
  PROVIDER_STAFF: "Business staff",
  MODERATOR: "Moderator",
  ADMIN: "Administrator",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const leads = await db.leadRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="container-page py-10">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">My account</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="font-medium text-ink">+91 {user.phone.replace(/^\+91/, "")}</span>{" "}
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <BadgeCheck size={12} /> {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </p>

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Profile</h2>
            <div className="mt-4">
              <ProfileForm initialName={user.name ?? ""} initialEmail={user.email ?? ""} />
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-ink">Your requirements</h2>
            {leads.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                You haven&apos;t posted any requirements yet.{" "}
                <Link href="/get-quotes" className="font-medium text-brand-600 hover:text-brand-700">
                  Post one now
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {leads.map((l) => (
                  <li key={l.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-ink">
                        {l.categorySlug ? l.categorySlug.replace(/-/g, " ") : "General enquiry"}
                        {l.citySlug ? ` · ${l.citySlug}` : ""}
                      </span>
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{l.message}</p>
                    <p className="mt-1 text-xs text-muted">{timeAgo(l.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-bold text-ink">Run a service business?</h2>
            <p className="mt-1 text-sm text-muted">
              List on Checkmate to receive customer enquiries in your categories and localities.
            </p>
            <Link
              href="/business/join"
              className={buttonVariants({ variant: "primary", size: "sm" }) + " mt-4 w-full"}
            >
              List your business <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
