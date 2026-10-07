import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Panel } from "./ui";

export function WizardHeader({
  trail,
  title,
  description,
  backHref,
}: {
  trail: { label: string; href?: string }[];
  title: string;
  description: string;
  backHref: string;
}) {
  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-2 text-sm">
        {trail.map((item, i) => (
          <span key={item.label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-navy font-medium">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
      <div className="mt-3 flex items-start gap-4">
        <Link
          href={backHref}
          aria-label="Retour"
          className="border-border text-navy flex size-11 shrink-0 items-center justify-center rounded-xl border bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted mt-1 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

export interface WizardStep {
  title: string;
  subtitle: string;
}

/** The numbered steps of a wizard: done steps show a check, the current one is filled. */
export function Stepper({ steps, current }: { steps: WizardStep[]; current: number }) {
  return (
    <ol aria-label="Étapes" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} aria-current={active ? "step" : undefined} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                active
                  ? "bg-brand shadow-soft text-white"
                  : done
                    ? "text-brand bg-blue-100"
                    : "bg-blue-50 text-blue-300",
              )}
            >
              {done ? <Check className="size-5" aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0 leading-tight">
              <span
                className={cn("block text-sm font-bold", active || done ? "text-navy" : "text-slate-400")}
              >
                {s.title}
              </span>
              <span className="text-muted block truncate text-xs">{s.subtitle}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const TONES = {
  info: { box: "bg-blue-50", icon: "text-brand", Icon: Info },
  tip: { box: "bg-amber-50", icon: "text-amber-500", Icon: Lightbulb },
  success: { box: "bg-green-50", icon: "text-green-600", Icon: Check },
} as const;

export function InfoBox({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl p-4", box, className)}>
      <span
        className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white", icon)}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="text-sm">
        <p className="text-navy font-semibold">{title}</p>
        <div className="text-muted mt-1 text-[13px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Right-hand live preview of what is being created. */
export function PreviewPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </Panel>
  );
}

export function WizardNav({
  onPrevious,
  onNext,
  previousLabel = "Précédent",
  nextLabel = "Suivant",
  nextIcon,
  pending,
  extra,
}: {
  onPrevious: () => void;
  onNext: () => void;
  previousLabel?: string;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  pending?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        className="border-brand/40 text-brand flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
      >
        <ArrowLeft className="size-4" aria-hidden /> {previousLabel}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {extra}
        <button
          type="button"
          onClick={onNext}
          disabled={pending}
          className="bg-brand flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : nextLabel}{" "}
          {nextIcon ?? <ChevronRight className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
