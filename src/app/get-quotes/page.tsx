import type { Metadata } from "next";
import { resolveCitySlug, getCity } from "@/lib/queries";
import { EnquiryForm } from "@/components/site/enquiry-form";

export const metadata: Metadata = {
  title: "Post your requirement",
  description: "Tell us what you need and get free quotes from verified local providers.",
};

export default async function GetQuotesPage() {
  const citySlug = await resolveCitySlug();
  const city = await getCity(citySlug);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Post your requirement</h1>
        <p className="mt-2 text-sm text-muted">
          One form, multiple quotes. Verified providers in {city?.name ?? "your city"} will reach out
          to you directly. It&apos;s free.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-surface p-6">
          <EnquiryForm citySlug={citySlug} />
        </div>
      </div>
    </div>
  );
}
