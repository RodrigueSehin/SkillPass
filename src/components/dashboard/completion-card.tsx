import Link from "next/link";
import { ChevronRight, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { completionMessage, type Completion } from "@/lib/completion";

export function CompletionCard({ completion }: { completion: Completion }) {
  const message = completionMessage(completion);
  return (
    <section
      aria-labelledby="completion-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="completion-title" className="text-navy text-lg font-bold">
          Complétion de votre profil
        </h2>
        <p className="text-navy text-2xl font-extrabold">{completion.percent}%</p>
      </div>
      <Progress
        value={completion.percent}
        className="mt-3 h-3"
        indicatorClassName="bg-success"
        aria-label="Complétion du profil"
      />
      <Link
        href={message.href}
        className="border-border/60 mt-5 flex items-center gap-4 rounded-xl border bg-slate-50/70 p-4 transition-colors hover:bg-blue-50/60"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <Lightbulb className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-navy block text-sm font-semibold">{message.title}</span>
          <span className="text-muted mt-0.5 block text-xs">{message.hint}</span>
        </span>
        <ChevronRight className="text-brand size-5 shrink-0" aria-hidden />
      </Link>
    </section>
  );
}
