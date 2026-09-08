import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <StubPage
      title="Terms of use"
      note="Terms of use will be published before the public launch. This build is for development and demo only."
    />
  );
}
