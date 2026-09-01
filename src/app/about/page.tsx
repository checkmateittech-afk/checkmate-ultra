import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StubPage
      title="About Checkmate"
      note="Checkmate connects people with trusted local service providers and businesses. This is an in-progress build — the public directory and search are live; provider tools, reviews collection and billing follow."
    />
  );
}
