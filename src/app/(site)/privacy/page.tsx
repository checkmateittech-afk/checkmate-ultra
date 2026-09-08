import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <StubPage
      title="Privacy policy"
      note="A full privacy policy (including DPDP Act disclosures, retention and deletion) is part of the launch-hardening module."
    />
  );
}
