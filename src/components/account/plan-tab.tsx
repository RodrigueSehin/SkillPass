"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Sparkles } from "lucide-react";
import { changeTalentPlanAction } from "@/app/dashboard/settings/actions";
import { SoonBadge } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";
import { TALENT_PLAN_CODES, TALENT_PLANS, type TalentPlanCode } from "@/lib/plans/entitlements";
import { cn } from "@/lib/utils/cn";

function Usage({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max === null ? 0 : Math.min(100, Math.round((used / max) * 100));
  return (
    <li>
      <p className="flex items-center justify-between text-sm">
        <span className="text-navy">{label}</span>
        <span className="text-navy font-semibold">
          {max === null ? `${used} · illimité` : `${used} / ${max}`}
        </span>
      </p>
      {max !== null && (
        <span className="mt-1 block h-2 rounded-full bg-slate-100">
          <span
            className={cn("block h-2 rounded-full", pct >= 100 ? "bg-red-500" : "bg-brand")}
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </li>
  );
}

/** The two talent plans, what each includes and how much of the current plan is used. */
export function PlanTab({
  plan,
  usage,
  canSwitch,
}: {
  plan: TalentPlanCode;
  usage: { skills: number; projects: number };
  canSwitch: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const current = TALENT_PLANS[plan];

  function choose(code: TalentPlanCode) {
    setError(undefined);
    startTransition(async () => {
      const result = await changeTalentPlanAction(code);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <ul className="grid gap-5 md:grid-cols-2">
          {TALENT_PLAN_CODES.map((code) => {
            const def = TALENT_PLANS[code];
            const isCurrent = code === plan;
            const featured = code === "PRO";
            return (
              <li
                key={code}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5",
                  featured
                    ? "border-brand from-brand to-navy shadow-lift bg-gradient-to-b text-white"
                    : "border-border/60 shadow-soft bg-white",
                )}
              >
                {featured && (
                  <span className="bg-navy absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white">
                    <Crown className="size-3.5 text-amber-400" aria-hidden /> Populaire
                  </span>
                )}
                <h2 className="text-xl font-bold">{def.name}</h2>
                <p className={cn("text-sm", featured ? "text-white/80" : "text-muted")}>{def.tagline}</p>
                <p className="mt-4 text-2xl font-extrabold tracking-tight">{def.price}</p>
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className={cn(
                      "mt-4 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold",
                      featured ? "text-brand bg-white" : "border-brand text-brand border bg-white",
                    )}
                  >
                    <Check className="size-4" aria-hidden /> Plan actuel
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canSwitch || pending}
                    onClick={() => choose(code)}
                    className={cn(
                      "mt-4 h-11 rounded-xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                      featured
                        ? "text-brand bg-white"
                        : "border-brand text-brand border bg-white hover:bg-blue-50",
                    )}
                  >
                    {code === "PRO" ? "Passer à Pro" : "Revenir à Free"}
                  </button>
                )}
                <ul className="mt-5 space-y-2.5 text-sm">
                  {def.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5">
                      <Check
                        className={cn("mt-0.5 size-4 shrink-0", featured ? "text-white" : "text-brand")}
                        aria-hidden
                      />
                      <span>{f.label}</span>
                      {f.soon && (
                        <span className="ml-auto self-start">
                          <SoonBadge className={featured ? "bg-white/20 text-white" : undefined} />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="text-muted text-xs">
          {canSwitch
            ? "Mode démo : le changement de plan est gratuit et sert à essayer les limites de chaque plan."
            : "Le paiement en ligne n'est pas encore ouvert : le changement de plan se fera ici dès son ouverture."}
        </p>
        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 font-bold">
            <Sparkles className="text-brand size-5" aria-hidden /> Votre abonnement actuel
          </h2>
          <p className="text-navy mt-3 text-lg font-bold">Plan {current.name}</p>
          <ul className="mt-4 space-y-3">
            <Usage label="Compétences" used={usage.skills} max={current.maxSkills} />
            <Usage label="Projets" used={usage.projects} max={current.maxProjects} />
          </ul>
          {plan === "FREE" && (
            <p className="text-muted mt-4 text-xs">
              Le plan Pro débloque les évaluations, le portfolio et les badges, et supprime ces limites.
            </p>
          )}
        </Panel>
      </aside>
    </div>
  );
}
