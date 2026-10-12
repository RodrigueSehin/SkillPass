import { CalendarDays, Link2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { EVIDENCE_TYPE_LABELS, USER_EVIDENCE_TYPES } from "@/types/evidence";
import { TYPE_ICONS } from "../evidence-bits";
import { VisibilityPicker } from "./visibility-picker";
import type { Patch, StepErrors, WizardState } from "./wizard-types";
import { cardClass, FieldError, inputClass, Optional, Required } from "./wizard-ui";

interface Props {
  values: WizardState;
  errors: StepErrors;
  patch: Patch;
}

export function StepGeneral({ values: v, errors, patch }: Props) {
  const isProject = v.type === "PROJECT";
  return (
    <div className="space-y-6">
      <section aria-label="Informations générales" className={cardClass}>
        <h2 className="text-navy text-xl font-extrabold">Informations générales</h2>

        <div className="space-y-2">
          <Label htmlFor="ev-title">
            Titre de la preuve
            <Required />
          </Label>
          <div className="relative">
            <input
              id="ev-title"
              value={v.title}
              maxLength={100}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Ex : CRUISE / A' Quotation"
              aria-invalid={Boolean(errors.title)}
              className={cn(inputClass, "pr-20")}
            />
            <span className="text-muted absolute top-3 right-4 text-xs">{v.title.length}/100</span>
          </div>
          <FieldError message={errors.title} />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-foreground text-sm font-medium">
            Type de preuve
            <Required />
          </legend>
          <div className="flex flex-wrap gap-2">
            {USER_EVIDENCE_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t];
              const on = v.type === t;
              return (
                <label
                  key={t}
                  className={cn(
                    "focus-within:ring-brand/40 flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium focus-within:ring-2",
                    on
                      ? "border-brand bg-brand text-white"
                      : "border-border text-navy bg-white hover:bg-slate-50",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={on}
                    onChange={() => patch({ type: t })}
                    className="sr-only"
                  />
                  <Icon className="size-4" aria-hidden /> {EVIDENCE_TYPE_LABELS[t]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="ev-description">
            Description
            <Required />
          </Label>
          <div className="relative">
            <textarea
              id="ev-description"
              rows={4}
              maxLength={500}
              value={v.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Décrivez votre preuve, son contexte et les résultats obtenus…"
              aria-invalid={Boolean(errors.description)}
              className="border-border focus-visible:ring-brand/40 aria-[invalid=true]:border-danger w-full resize-none rounded-xl border bg-white px-4 py-3 pb-8 text-sm outline-none focus-visible:ring-2"
            />
            <span className="text-muted absolute right-3 bottom-2 text-xs">{v.description.length}/500</span>
          </div>
          <FieldError message={errors.description} />
        </div>
      </section>

      <section aria-label="Contexte" className={cardClass}>
        <h2 className="text-navy text-xl font-extrabold">{isProject ? "Contexte du projet" : "Contexte"}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ev-org">
              Organisation / Entreprise
              <Optional />
            </Label>
            <input
              id="ev-org"
              value={v.organization}
              maxLength={120}
              onChange={(e) => patch({ organization: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <span className="text-foreground block text-sm font-medium">
              Période
              <Optional />
            </span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="relative">
                <CalendarDays
                  className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                  aria-hidden
                />
                <input
                  type="month"
                  aria-label="Début"
                  value={v.startDate}
                  onChange={(e) => patch({ startDate: e.target.value })}
                  className={cn(inputClass, "pl-10")}
                />
              </div>
              <span className="text-muted">–</span>
              <input
                type="month"
                aria-label="Fin"
                value={v.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
                aria-invalid={Boolean(errors.endDate)}
                className={inputClass}
              />
            </div>
            <FieldError message={errors.endDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-role">
              Mon rôle
              {isProject ? <Required /> : <Optional />}
            </Label>
            <input
              id="ev-role"
              value={v.role}
              maxLength={120}
              onChange={(e) => patch({ role: e.target.value })}
              placeholder="Ex : UI/UX + Power Platform Developer"
              aria-invalid={Boolean(errors.role)}
              className={inputClass}
            />
            <FieldError message={errors.role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-url">
              Lien du projet
              <Optional />
            </Label>
            <div className="relative">
              <Link2
                className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4"
                aria-hidden
              />
              <input
                id="ev-url"
                type="url"
                inputMode="url"
                value={v.url}
                onChange={(e) => patch({ url: e.target.value })}
                placeholder="https://"
                aria-invalid={Boolean(errors.url)}
                className={cn(inputClass, "pl-10")}
              />
            </div>
            <FieldError message={errors.url} />
          </div>
        </div>
      </section>

      <section aria-label="Visibilité" className={cardClass}>
        <h2 className="text-navy text-xl font-extrabold">Visibilité</h2>
        <p className="text-navy text-sm font-semibold">Qui peut voir cette preuve ?</p>
        <VisibilityPicker value={v.visibility} onChange={(visibility) => patch({ visibility })} />
      </section>
    </div>
  );
}
