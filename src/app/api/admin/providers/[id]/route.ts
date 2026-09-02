import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { adminProviderSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const provider = await db.provider.findUnique({ where: { id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = adminProviderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 422 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.kycDecision === "VERIFIED") {
    data.kycStatus = "VERIFIED";
    data.verified = true;
  } else if (parsed.data.kycDecision === "REJECTED") {
    data.kycStatus = "REJECTED";
    data.verified = false;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  await db.$transaction([
    db.provider.update({ where: { id }, data }),
    ...(parsed.data.kycDecision
      ? [
          db.kycSubmission.updateMany({
            where: { providerId: id, status: "SUBMITTED" },
            data: { status: parsed.data.kycDecision, reviewedBy: user.id },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
