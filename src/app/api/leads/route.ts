import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { leadSchema } from "@/lib/validation";
import { getSessionUser } from "@/lib/auth";
import { distributeLeadRequest } from "@/lib/leads";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please check the form", fieldErrors }, { status: 422 });
  }

  const { name, phone, email, message, categorySlug, citySlug, providerId } = parsed.data;
  const session = await getSessionUser();

  const lead = await db.leadRequest.create({
    data: {
      name,
      phone,
      email: email || null,
      message,
      categorySlug: categorySlug || null,
      citySlug: citySlug || null,
      providerId: providerId || null,
      userId: session?.id ?? null,
      source: "web",
    },
    select: { id: true, createdAt: true },
  });

  const { delivered } = await distributeLeadRequest(lead.id);

  return NextResponse.json({ ok: true, id: lead.id, delivered }, { status: 201 });
}

const listQuery = z.object({
  status: z.string().optional(),
  take: z.coerce.number().min(1).max(100).default(25),
});

// Simple read endpoint — handy for the admin module later.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const { status, take } = listQuery.parse(Object.fromEntries(url.searchParams));
  const leads = await db.leadRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ leads });
}
