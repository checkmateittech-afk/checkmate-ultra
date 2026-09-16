import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings";
import { brandRamp } from "@/lib/color";
import { siteUrl } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: `${settings.siteName} — Find trusted local services & businesses`,
      template: `%s | ${settings.siteName}`,
    },
    description:
      settings.tagline ||
      "Search verified local service providers and businesses near you. Compare ratings and reviews, then send a free enquiry to get quotes.",
    metadataBase: new URL(siteUrl()),
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const ramp = settings.primaryColor ? brandRamp(settings.primaryColor) : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      style={
        ramp
          ? ({
              "--color-brand-50": ramp[50],
              "--color-brand-100": ramp[100],
              "--color-brand-500": ramp[500],
              "--color-brand-600": ramp[600],
              "--color-brand-700": ramp[700],
            } as React.CSSProperties)
          : undefined
      }
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
