import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SiteNotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The service or business you&apos;re looking for may have moved. Try searching from the homepage.
      </p>
      <Link href="/" className={buttonVariants({ variant: "primary" }) + " mt-6"}>
        Back to home
      </Link>
    </div>
  );
}
