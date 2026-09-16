import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings, upsertSiteSettings } from "@/lib/settings";
import { saveImageUpload, deleteUpload } from "@/lib/upload";

const FIELDS = { logo: "logoUrl", favicon: "faviconUrl" } as const;
type Kind = keyof typeof FIELDS;

function parseKind(url: string): Kind | null {
  const kind = new URL(url).searchParams.get("type");
  return kind === "logo" || kind === "favicon" ? kind : null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can change platform settings" }, { status: 403 });
  }
  const kind = parseKind(req.url);
  if (!kind) return NextResponse.json({ error: "Missing ?type=logo|favicon" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 422 });
  }

  const saved = await saveImageUpload(file, "branding");
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 422 });

  const current = await getSiteSettings();
  const field = FIELDS[kind];
  const previous = current[field];

  const settings = await upsertSiteSettings({ [field]: saved.url }, user.id);
  await deleteUpload(previous);

  return NextResponse.json({ ok: true, url: saved.url, settings });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can change platform settings" }, { status: 403 });
  }
  const kind = parseKind(req.url);
  if (!kind) return NextResponse.json({ error: "Missing ?type=logo|favicon" }, { status: 400 });

  const current = await getSiteSettings();
  const field = FIELDS[kind];
  const previous = current[field];

  const settings = await upsertSiteSettings({ [field]: null }, user.id);
  await deleteUpload(previous);

  return NextResponse.json({ ok: true, settings });
}
