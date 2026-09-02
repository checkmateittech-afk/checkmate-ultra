import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProvider, listLocalities } from "@/lib/queries";
import { ProviderProfileForm } from "./profile-form";
import { KycForm } from "./kyc-form";

export const metadata: Metadata = { title: "Business profile" };

const KYC_LABEL: Record<string, string> = {
  UNVERIFIED: "Not verified",
  SUBMITTED: "Submitted — under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected — please resubmit",
};

export default async function DashboardProfile() {
  const user = (await getCurrentUser())!;
  const provider = (await getOwnedProvider(user.id))!;
  const localities = await listLocalities(provider.city.slug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Business profile</h1>
        <p className="mt-1 text-sm text-muted">
          This is what customers see on your public page and in search results.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Details</h2>
        <div className="mt-4">
          <ProviderProfileForm
            initial={{
              about: provider.about,
              phone: provider.phone,
              email: provider.email ?? "",
              yearsInBusiness: String(provider.yearsInBusiness),
              addressLine: provider.addressLine,
              localitySlug: provider.locality.slug,
            }}
            localities={localities.map((l) => ({ slug: l.slug, name: l.name }))}
            cityName={provider.city.name}
            primaryService={provider.services[0]?.category.name ?? "—"}
          />
        </div>
      </section>

      <section id="verify" className="scroll-mt-24 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Verification</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              provider.kycStatus === "VERIFIED"
                ? "bg-emerald-50 text-emerald-700"
                : provider.kycStatus === "SUBMITTED"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-canvas text-muted"
            }`}
          >
            {KYC_LABEL[provider.kycStatus] ?? provider.kycStatus}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Submit a business document to get a Verified badge. Full document upload and admin review
          arrive in a later module — for now this records your submission.
        </p>
        <div className="mt-4">
          <KycForm
            status={provider.kycStatus}
            lastSubmission={
              provider.kycSubmissions[0]
                ? { docType: provider.kycSubmissions[0].docType, docRef: provider.kycSubmissions[0].docRef }
                : null
            }
          />
        </div>
      </section>
    </div>
  );
}
