import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "ck_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Role = "CONSUMER" | "PROVIDER_OWNER" | "PROVIDER_STAFF" | "MODERATOR" | "ADMIN";

export type SessionUser = {
  id: string;
  role: Role;
  name: string | null;
  phone: string;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ role: user.role, name: user.name, phone: user.phone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payloadToUser(payload);
  } catch {
    return null;
  }
}

export function payloadToUser(payload: JWTPayload): SessionUser | null {
  if (!payload.sub || typeof payload.role !== "string") return null;
  return {
    id: payload.sub,
    role: payload.role as Role,
    name: (payload.name as string | null) ?? null,
    phone: (payload.phone as string) ?? "",
  };
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Session user from the cookie (verified, but not re-checked against the DB). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Full, fresh user record — use when you need current role/status. */
export async function getCurrentUser() {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) throw new Error("FORBIDDEN");
  return user;
}
