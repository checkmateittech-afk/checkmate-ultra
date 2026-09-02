"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DOC_TYPES = [
  { value: "GST", label: "GSTIN" },
  { value: "PAN", label: "PAN" },
  { value: "UDYAM", label: "Udyam / MSME" },
  { value: "AADHAAR", label: "Aadhaar" },
] as const;

export function KycForm({
  status,
  lastSubmission,
}: {
  status: string;
  lastSubmission: { docType: string; docRef: string } | null;
}) {
  const router = useRouter();
  const [docType, setDocType] = useState<string>(lastSubmission?.docType ?? "GST");
  const [docRef, setDocRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "VERIFIED") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        <ShieldCheck size={16} /> Your business is verified.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/business/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, docRef, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {lastSubmission && status === "SUBMITTED" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Submitted: {lastSubmission.docType} · {lastSubmission.docRef}. You can resubmit if needed.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Document type">
          <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Document number">
          <Input value={docRef} onChange={(e) => setDocRef(e.target.value)} placeholder="Only the last 4 are stored" />
        </Field>
      </div>
      <Field label="Note (optional)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <Button type="submit" disabled={busy || docRef.trim().length < 4}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {status === "SUBMITTED" ? "Resubmit" : "Submit for verification"}
        </Button>
      </div>
    </form>
  );
}
