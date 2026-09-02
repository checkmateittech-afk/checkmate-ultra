import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { recalcProviderRating } from "@/lib/reviews";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to write a review" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return NextResponse.json({ error: "Please check the form", fieldErrors }, { status: 422 });
  }
  const { providerId, rating, title, body: text } = parsed.data;

  const provider = await db.provider.findFirst({ where: { id: providerId, status: "ACTIVE" }, select: { id: true, ownerId: true } });
  if (!provider) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (provider.ownerId === user.id) {
    return NextResponse.json({ error: "You can't review your own business" }, { status: 403 });
  }

  const existing = await db.review.findFirst({ where: { providerId, userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "You've already reviewed this business" }, { status: 409 });
  }

  await db.review.create({
    data: {
      providerId,
      userId: user.id,
      authorName: user.name ?? "Checkmate user",
      rating,
      title,
      body: text,
      status: "PUBLISHED",
    },
  });
  const agg = await recalcProviderRating(providerId);

  return NextResponse.json({ ok: true, ...agg }, { status: 201 });
}
