import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StubPage
      title="Contact us"
      note="A contact form lands with the support module. Meanwhile, post a requirement from any category page and a provider will get in touch."
    />
  );
}
