import Link from "next/link";
import { CheckCheck, Mail, Phone } from "lucide-react";
import { listCategories, listCities } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";

export async function SiteFooter() {
  const [categories, cities, settings] = await Promise.all([
    listCategories(),
    listCities(),
    getSiteSettings(),
  ]);
  const topCategories = categories.slice(0, 8);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteName} className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                <CheckCheck size={18} strokeWidth={2.5} />
              </span>
            )}
            <span className="text-lg font-extrabold text-ink">{settings.siteName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {settings.tagline ||
              "Find and hire trusted local service providers and businesses. Compare reviews, get free quotes, hire with confidence."}
          </p>
          {(settings.supportEmail || settings.supportPhone) && (
            <div className="mt-4 flex flex-col gap-1.5 text-sm text-muted">
              {settings.supportEmail && (
                <a href={`mailto:${settings.supportEmail}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                  <Mail size={14} /> {settings.supportEmail}
                </a>
              )}
              {settings.supportPhone && (
                <a href={`tel:${settings.supportPhone}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                  <Phone size={14} /> {settings.supportPhone}
                </a>
              )}
            </div>
          )}
        </div>

        <FooterCol title="Popular services">
          {topCategories.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="hover:text-brand-600">
              {c.name}
            </Link>
          ))}
        </FooterCol>

        <FooterCol title="Cities">
          {cities.map((c) => (
            <Link key={c.slug} href={`/search?city=${c.slug}`} className="hover:text-brand-600">
              Services in {c.name}
            </Link>
          ))}
        </FooterCol>

        <FooterCol title="Company">
          <Link href="/courses" className="hover:text-brand-600">Courses &amp; training</Link>
          <Link href="/about" className="hover:text-brand-600">About {settings.siteName}</Link>
          <Link href="/business/join" className="hover:text-brand-600">List your business</Link>
          <Link href="/get-quotes" className="hover:text-brand-600">Post a requirement</Link>
          <Link href="/contact" className="hover:text-brand-600">Contact us</Link>
        </FooterCol>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.siteName}. Demo build.</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-600">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-600">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 flex flex-col gap-2 text-sm text-muted">{children}</div>
    </div>
  );
}
