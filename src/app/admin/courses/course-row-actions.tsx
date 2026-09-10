"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreVertical } from "lucide-react";

export function CourseRowActions({
  id,
  status,
  canDelete,
}: {
  id: string;
  status: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patch(next: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this course permanently?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-line p-1.5 hover:bg-canvas"
        aria-label="More actions"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
            {status !== "PUBLISHED" && (
              <button onClick={() => patch("PUBLISHED")} className="block w-full px-3 py-2 text-left hover:bg-canvas">
                Publish
              </button>
            )}
            {status === "PUBLISHED" && (
              <button onClick={() => patch("DRAFT")} className="block w-full px-3 py-2 text-left hover:bg-canvas">
                Unpublish (draft)
              </button>
            )}
            {status !== "ARCHIVED" && (
              <button onClick={() => patch("ARCHIVED")} className="block w-full px-3 py-2 text-left hover:bg-canvas">
                Archive
              </button>
            )}
            {canDelete && (
              <button onClick={remove} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
