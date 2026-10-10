import { cn } from "@/lib/utils/cn";

/** Circular match gauge, as in the mockups: green from 85, blue from 70, amber below. */
export function MatchRing({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? "stroke-emerald-500" : value >= 70 ? "stroke-brand" : "stroke-amber-500";
  return (
    <div className={cn("relative shrink-0", size === "lg" ? "size-20" : "size-14")}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          className={tone}
        />
      </svg>
      <span
        role="img"
        aria-label={`Correspondance ${value} %`}
        className={cn(
          "text-navy absolute inset-0 flex items-center justify-center font-bold",
          size === "lg" ? "text-xl" : "text-sm",
        )}
      >
        {value}%
      </span>
    </div>
  );
}
