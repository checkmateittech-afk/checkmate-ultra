import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSessionUser();
  if (session) redirect(next || "/account");

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<div className="h-96 rounded-2xl border border-line bg-surface" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-xs text-muted">
          By continuing you agree to Checkmate&apos;s Terms and acknowledge the Privacy Policy.
        </p>
      </div>
    </div>
  );
}
