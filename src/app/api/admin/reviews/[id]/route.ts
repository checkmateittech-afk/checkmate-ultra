import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { adminReviewSchema } from "@/lib/validation";
import { recalcProviderRating } from "@/lib/reviews";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const review = await db.review.findUnique({ where: { id }, select: { id: true, providerId: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = adminReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 422 });

  await db.review.update({ where: { id }, data: { status: parsed.data.status } });
  const agg = await recalcProviderRating(review.providerId);

  return NextResponse.json({ ok: true, ...agg });
}
