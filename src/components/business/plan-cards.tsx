"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { changePlanAction } from "@/app/business/abonnements/actions";
import { PLANS, formatFcfa, yearlyMonthlyPrice } from "@/lib/business/plans";
import { cn } from "@/lib/utils/cn";
import type { PlanCode } from "@/types/business";
import { PLAN_ICONS, PLAN_TINTS } from "./plan-icons";

const ORDER: PlanCode[] = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];

/** Monthly/yearly switch and the four plans. Choosing a plan only works where payment is not needed (demo). */
export function PlanCards({
  current,
  canSwitch,
  canEdit,
  header,
}: {
  /** Title and subtitle of the page, shown on the left of the billing switch. */
  header: React.ReactNode;
  current: PlanCode;
  canSwitch: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function choose(code: PlanCode) {
    setError(undefined);
    startTransition(async () => {
      const result = await changePlanAction(code);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {header}
        <div className="flex items-start gap-3">
          <p className="text-brand mt-0.5 hidden max-w-36 text-right text-xs leading-tight italic sm:block">
            Économisez 20 % avec l&apos;abonnement annuel !
          </p>
          <div
            className="border-border flex rounded-xl border bg-white p-1 text-sm font-semibold"
            role="group"
            aria-label="Période de facturation"
          >
            <button
              type="button"
              aria-pressed={!yearly}
              onClick={() => setYearly(false)}
              className={cn("rounded-lg px-5 py-2", !yearly ? "text-brand bg-blue-50" : "text-muted")}
            >
              Mensuel
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2",
                yearly ? "text-brand bg-blue-50" : "text-muted",
              )}
            >
              Annuel{" "}
              <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((code) => {
          const plan = PLANS[code];
          const Icon = PLAN_ICONS[code];
          const featured = code === "BUSINESS";
          const isCurrent = code === current;
          const price = plan.price === null ? null : yearly ? yearlyMonthlyPrice(plan.price) : plan.price;
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
                  <Crown className="size-3.5 text-amber-400" aria-hidden /> Recommandé
                </span>
              )}
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    featured ? "bg-white/15" : PLAN_TINTS[code].tile,
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p className={cn("text-sm", featured ? "text-white/80" : "text-muted")}>{plan.tagline}</p>
                </div>
              </div>
              <p className="mt-5 text-3xl font-extrabold tracking-tight">
                {price === null ? "Sur devis" : formatFcfa(price)}
              </p>
              {price !== null && (
                <p className={cn("text-sm", featured ? "text-white/80" : "text-muted")}>
                  / mois{yearly ? ", facturé à l'année" : ""}
                </p>
              )}
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
                  disabled={!canSwitch || !canEdit || pending || plan.price === null}
                  onClick={() => choose(code)}
                  className={cn(
                    "mt-4 h-11 rounded-xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                    featured
                      ? "text-brand bg-white"
                      : "border-brand text-brand border bg-white hover:bg-blue-50",
                  )}
                >
                  {plan.price === null ? "Nous contacter" : "Choisir ce plan"}
                </button>
              )}
              <ul className="mt-5 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={cn("mt-0.5 size-4 shrink-0", featured ? "text-white" : "text-brand")}
                      aria-hidden
                    />{" "}
                    {f}
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
  );
}
