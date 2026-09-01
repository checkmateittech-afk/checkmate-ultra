import Link from "next/link";
import { Construction } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function StubPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Construction size={24} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{note}</p>
      <Link href="/" className={buttonVariants({ variant: "outline" }) + " mt-6"}>
        Back to home
      </Link>
    </div>
  );
}
