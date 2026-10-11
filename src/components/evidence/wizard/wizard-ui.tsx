import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STEPS } from "./wizard-types";

export const inputClass =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";
export const cardClass = "border-border/60 shadow-soft space-y-5 rounded-2xl border bg-white p-6";
export const sideCardClass = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export const Required = () => <span className="text-danger"> *</span>;
export const Optional = () => <span className="text-muted font-normal"> (optionnel)</span>;

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-danger text-sm">
      {message}
    </p>
  ) : null;
}

export function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label="Étapes" className="border-border/60 shadow-soft grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-4">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} aria-current={active ? "step" : undefined} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold",
                done || active ? "bg-brand border-brand text-white" : "border-border text-navy bg-white",
              )}
            >
              {done ? <Check className="size-5" aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-bold", active || done ? "text-brand" : "text-navy")}>
                {s.title}
              </span>
              <span className="text-muted block text-xs">{s.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
