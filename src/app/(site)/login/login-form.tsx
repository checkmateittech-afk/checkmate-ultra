"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "phone" | "code";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send code");
        if (res.status === 429) setCooldown(Number(res.headers.get("Retry-After")) || 30);
        return;
      }
      setDevCode(data.devCode ?? null);
      setStep("code");
      setCooldown(30);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 text-brand-600">
        <ShieldCheck size={20} />
        <span className="text-sm font-semibold">Secure sign in</span>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-4 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-ink">Enter your mobile number</h1>
          <p className="-mt-2 text-sm text-muted">
            We&apos;ll send a one-time code to verify it. New here? An account is created automatically.
          </p>
          <Field label="Mobile number">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface pl-3 focus-within:border-brand-400">
              <Phone size={16} className="text-muted" />
              <span className="text-sm text-muted">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit number"
                className="h-11 w-full bg-transparent text-sm text-ink focus-visible:outline-none"
                required
              />
            </div>
          </Field>
          <Field label="Your name (optional)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anita Rao" autoComplete="name" />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy || cooldown > 0} className="w-full">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {cooldown > 0 ? `Wait ${cooldown}s` : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => { setStep("phone"); setCode(""); setError(null); }}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft size={14} /> Change number
          </button>
          <h1 className="text-xl font-bold text-ink">Enter the 6-digit code</h1>
          <p className="-mt-2 text-sm text-muted">
            Sent to <span className="font-medium text-ink">+91 {phone}</span>
          </p>
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Dev mode — your code is <span className="font-mono font-bold">{devCode}</span>
            </p>
          )}
          <Field label="Verification code">
            <Input
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="tracking-[0.5em] text-center text-lg"
              required
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Verify &amp; continue
          </Button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={cooldown > 0 || busy}
            className="text-sm text-brand-600 hover:text-brand-700 disabled:text-muted"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      )}
    </div>
  );
}
