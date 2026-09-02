import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { setSessionCookie, type Role } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().min(4).max(8),
  name: z.string().trim().min(2).max(80).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 422 });
  }

  const result = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const existing = await db.user.findUnique({ where: { phone: result.phone } });
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          lastLogin: new Date(),
          name: existing.name ?? parsed.data.name ?? null,
        },
      })
    : await db.user.create({
        data: {
          phone: result.phone,
          name: parsed.data.name ?? null,
          role: "CONSUMER",
          lastLogin: new Date(),
        },
      });

  await setSessionCookie({
    id: user.id,
    role: user.role as Role,
    name: user.name,
    phone: user.phone,
  });

  return NextResponse.json({
    ok: true,
    isNew: !existing,
    user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
  });
}
