import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export type SavedUpload = { ok: true; url: string } | { ok: false; error: string };

/** Saves an uploaded image under public/uploads/<folder>/ and returns its public URL. */
export async function saveImageUpload(file: File, folder: string): Promise<SavedUpload> {
  if (!ALLOWED_TYPES[file.type]) {
    return { ok: false, error: "Use a PNG, JPG, WebP, SVG or ICO file." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 2MB." };
  }

  const ext = ALLOWED_TYPES[file.type];
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  return { ok: true, url: `/uploads/${folder}/${name}` };
}

/** Best-effort delete of a previously uploaded file, given its public URL. Never throws. */
export async function deleteUpload(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // ignore — file may already be gone
  }
}
