import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "List your business" };

export default function BusinessJoinPage() {
  return (
    <StubPage
      title="Provider onboarding is coming next"
      note="The business registration wizard, KYC verification and provider dashboard are the next module on the roadmap."
    />
  );
}
