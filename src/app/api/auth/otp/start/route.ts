import { NextResponse } from "next/server";
import { z } from "zod";
import { startOtp } from "@/lib/otp";

const schema = z.object({ phone: z.string().min(6).max(20) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 422 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const result = await startOtp(parsed.data.phone, ip);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.retryAfter ? 429 : 422, headers: result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined },
    );
  }

  return NextResponse.json({ ok: true, devCode: result.devCode });
}
