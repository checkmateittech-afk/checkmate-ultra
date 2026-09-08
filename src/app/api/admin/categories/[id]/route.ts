import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  leadPrice: z.coerce.number().int().min(1).max(100000).optional(),
  blurb: z.string().trim().min(4).max(200).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const category = await db.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid values" }, { status: 422 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  const updated = await db.category.update({
    where: { id },
    data: parsed.data,
    select: { id: true, leadPrice: true, blurb: true },
  });
  return NextResponse.json({ ok: true, category: updated });
}
