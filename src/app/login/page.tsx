import type { Metadata } from "next";
import { StubPage } from "@/components/site/stub-page";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <StubPage
      title="Login is coming in the Auth module"
      note="Phone-OTP and email sign-in land in a later module. For now you can browse providers and post requirements without an account."
    />
  );
}
