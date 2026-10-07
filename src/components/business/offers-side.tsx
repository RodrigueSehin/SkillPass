"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Lightbulb, Plus, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Panel } from "./ui";

/** "Créer une offre d'emploi" card with a tip that can be dismissed for the visit. */
export function CreateOfferCard({ canCreate }: { canCreate: boolean }) {
  const [tip, setTip] = useState(true);
  return (
    <Panel className="p-5">
      <div className="flex items-start gap-3">
        <span className="text-brand flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
          <BriefcaseBusiness className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-navy font-bold">Créer une offre d&apos;emploi</h2>
          <p className="text-muted mt-1 text-sm">Attirez les meilleurs talents en quelques étapes simples.</p>
        </div>
      </div>
      {canCreate && (
        <Link
          href="/business/offres/nouvelle"
          className={cn(buttonVariants({ variant: "outline" }), "border-brand text-brand mt-4 w-full")}
        >
          <Plus /> Créer une offre
        </Link>
      )}
      {tip && (
        <div className="relative mt-4 flex gap-3 rounded-xl bg-slate-50 p-3 pr-8">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
          <div className="text-sm">
            <p className="text-navy font-semibold">Conseil</p>
            <p className="text-muted mt-0.5 text-xs leading-relaxed">
              Des offres bien détaillées et avec les compétences clés obtiennent 2x plus de candidatures.
            </p>
          </div>
          <button
            type="button"
            aria-label="Masquer le conseil"
            onClick={() => setTip(false)}
            className="text-muted absolute top-2 right-2 rounded p-1 hover:bg-slate-200"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </Panel>
  );
}
