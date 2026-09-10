import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { listCities, resolveCitySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { CitySelect } from "./city-select";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const [cities, city, session] = await Promise.all([
    listCities(),
    resolveCitySlug(),
    getCurrentUser(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <CheckCheck size={20} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink">
            checkmate
          </span>
        </Link>

        <div className="hidden lg:block">
          <CitySelect cities={cities} current={city} />
        </div>

        <div className="mx-2 hidden max-w-md flex-1 md:block">
          <SearchBar cities={cities} currentCity={city} variant="compact" />
        </div>

        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/courses"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-canvas sm:block"
          >
            Courses
          </Link>
          <Link
            href="/business/join"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-canvas lg:block"
          >
            List your business
          </Link>
          {session ? (
            <UserMenu name={session.name} phone={session.phone} role={session.role} />
          ) : (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Login
            </Link>
          )}
          <Link href="/get-quotes" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Post your requirement
          </Link>
        </nav>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchBar cities={cities} currentCity={city} variant="compact" />
      </div>
    </header>
  );
}
