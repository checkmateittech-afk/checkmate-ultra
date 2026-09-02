import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewReplySchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const provider = await db.provider.findUnique({ where: { ownerId: user.id }, select: { id: true } });
  if (!provider) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const review = await db.review.findUnique({ where: { id }, select: { id: true, providerId: true } });
  if (!review || review.providerId !== provider.id) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = reviewReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Write a reply" }, { status: 422 });

  await db.review.update({
    where: { id: review.id },
    data: { providerReply: parsed.data.reply, providerRepliedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
