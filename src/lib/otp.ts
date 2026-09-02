import "server-only";
import { createHash, randomInt } from "crypto";
import { db } from "@/lib/db";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 5;
const WINDOW_MIN = 15;
const MIN_RESEND_SECONDS = 30;

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (input.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:${process.env.AUTH_SECRET}`).digest("hex");
}

export type StartResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string; retryAfter?: number };

/** Create + "send" an OTP. In dev the code is logged and returned for convenience. */
export async function startOtp(phoneRaw: string, ip?: string): Promise<StartResult> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number" };

  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const recent = await db.otpChallenge.findMany({
    where: { phone, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    return { ok: false, error: "Too many codes requested. Try again in a few minutes.", retryAfter: WINDOW_MIN * 60 };
  }
  if (recent[0]) {
    const elapsed = (Date.now() - recent[0].createdAt.getTime()) / 1000;
    if (elapsed < MIN_RESEND_SECONDS) {
      return { ok: false, error: "Please wait before requesting another code.", retryAfter: Math.ceil(MIN_RESEND_SECONDS - elapsed) };
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpChallenge.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
      ip: ip ?? null,
    },
  });

  await sendSms(phone, `${code} is your Checkmate verification code. Valid for ${CODE_TTL_MIN} minutes.`);

  return process.env.NODE_ENV === "production" ? { ok: true } : { ok: true, devCode: code };
}

export type VerifyResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export async function verifyOtp(phoneRaw: string, code: string): Promise<VerifyResult> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, error: "Enter a valid mobile number" };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code" };

  const challenge = await db.otpChallenge.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return { ok: false, error: "Code expired. Request a new one." };
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  if (challenge.codeHash !== hashCode(phone, code)) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  await db.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  return { ok: true, phone };
}

/** Pluggable SMS sender. Swap for MSG91 / Twilio in a later module. */
async function sendSms(to: string, body: string) {
  // TODO(module: notifications): integrate MSG91 with DLT-registered templates.
  console.log(`[SMS→${to}] ${body}`);
}
