import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const DEFAULT_SITE_NAME = "Checkmate";

export type SiteSettingsData = {
  siteName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  primaryColor: string | null;
  announcementText: string | null;
  announcementActive: boolean;
  updatedAt: Date | null;
};

const DEFAULTS: SiteSettingsData = {
  siteName: DEFAULT_SITE_NAME,
  tagline: null,
  logoUrl: null,
  faviconUrl: null,
  supportEmail: null,
  supportPhone: null,
  primaryColor: null,
  announcementText: null,
  announcementActive: false,
  updatedAt: null,
};

/** Cached per-request read. Always returns a full object, even before any row exists. */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const row = await db.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return DEFAULTS;
  return row;
});

export async function upsertSiteSettings(data: Partial<Omit<SiteSettingsData, "updatedAt">>, updatedById?: string) {
  return db.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data, updatedById },
    update: { ...data, updatedById },
  });
}
