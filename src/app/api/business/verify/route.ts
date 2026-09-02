import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { kycSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({ where: { ownerId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = kycSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid document number" }, { status: 422 });
  }
  const { docType, docRef, note } = parsed.data;
  const masked = docRef.length > 4 ? `${"X".repeat(docRef.length - 4)}${docRef.slice(-4)}` : docRef;

  await db.$transaction([
    db.kycSubmission.create({
      data: { providerId: provider.id, docType, docRef: masked, note: note || null },
    }),
    db.provider.update({ where: { id: provider.id }, data: { kycStatus: "SUBMITTED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
