import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ck_session";

// Route prefixes that require a signed-in user, with the role(s) allowed.
const GUARDS: { prefix: string; roles?: string[] }[] = [
  { prefix: "/account" },
  { prefix: "/dashboard", roles: ["PROVIDER_OWNER", "PROVIDER_STAFF", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN", "MODERATOR"] },
];

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const guard = GUARDS.find((g) => pathname === g.prefix || pathname.startsWith(g.prefix + "/"));
  if (!guard) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let payload: Record<string, unknown> | null = null;
  if (token) {
    try {
      payload = (await jwtVerify(token, secret())).payload as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (guard.roles && !guard.roles.includes(String(payload.role))) {
    const url = req.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/dashboard/:path*", "/admin/:path*"],
};
