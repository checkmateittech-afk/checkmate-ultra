import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings, upsertSiteSettings } from "@/lib/settings";
import { siteSettingsSchema } from "@/lib/validation";
import { isHex6 } from "@/lib/color";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can change platform settings" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  }
  const d = parsed.data;

  const color = d.primaryColor ? d.primaryColor.replace("#", "") : d.primaryColor;
  if (color && !isHex6(color)) {
    return NextResponse.json({ error: "Use a 6-digit hex color" }, { status: 422 });
  }

  const settings = await upsertSiteSettings(
    {
      ...(d.siteName !== undefined ? { siteName: d.siteName } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline || null } : {}),
      ...(d.supportEmail !== undefined ? { supportEmail: d.supportEmail || null } : {}),
      ...(d.supportPhone !== undefined ? { supportPhone: d.supportPhone || null } : {}),
      ...(d.primaryColor !== undefined ? { primaryColor: color || null } : {}),
      ...(d.announcementText !== undefined ? { announcementText: d.announcementText || null } : {}),
      ...(d.announcementActive !== undefined ? { announcementActive: d.announcementActive } : {}),
    },
    user.id,
  );

  return NextResponse.json({ ok: true, settings });
}
