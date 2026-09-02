import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, setSessionCookie, type Role } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, email: user.email },
  });
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

export async function PATCH(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the details you entered" }, { status: 422 });
  }

  const user = await db.user.update({
    where: { id: current.id },
    data: {
      name: parsed.data.name ?? current.name,
      email: parsed.data.email === "" ? null : parsed.data.email ?? current.email,
    },
  });

  await setSessionCookie({
    id: user.id,
    role: user.role as Role,
    name: user.name,
    phone: user.phone,
  });

  return NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
}
