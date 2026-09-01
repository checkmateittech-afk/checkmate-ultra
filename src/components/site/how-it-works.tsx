import { Search, MessagesSquare, ThumbsUp } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search & shortlist",
    body: "Browse verified providers by service and locality. Check ratings, reviews and pricing.",
  },
  {
    icon: MessagesSquare,
    title: "Get free quotes",
    body: "Post your requirement once. Matching providers reach out with quotes — no charge to you.",
  },
  {
    icon: ThumbsUp,
    title: "Compare & hire",
    body: "Compare responses, read genuine reviews, and hire the professional that fits best.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((s, i) => (
        <div key={s.title} className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <s.icon size={20} />
            </span>
            <span className="text-xs font-semibold text-muted">STEP {i + 1}</span>
          </div>
          <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
          <p className="mt-1 text-sm text-muted">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
