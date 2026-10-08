"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  Database,
  FileText,
  Info,
  Pencil,
  Save,
  Search,
  Share2,
  Trash2,
  UserCheck,
  Users,
  Download,
} from "lucide-react";
import { saveComplianceAction } from "@/app/business/parametres/actions";
import { cn } from "@/lib/utils/cn";
import { REGULATIONS, RETENTION_YEARS, type ComplianceSettings } from "@/types/org-settings";
import { Panel } from "../ui";
import { Switch } from "./controls";
import { SettingRow, SoonBadge } from "./rows";

const RIGHTS = [
  {
    icon: Search,
    title: "Droit d'accès",
    text: "Permet aux utilisateurs d'accéder à leurs données personnelles.",
  },
  { icon: Pencil, title: "Droit de rectification", text: "Permet la modification des données inexactes." },
  { icon: Trash2, title: "Droit à l'effacement", text: "Permet la suppression des données sur demande." },
  {
    icon: Download,
    title: "Portabilité des données",
    text: "Permet l'exportation des données dans un format standard.",
  },
];

export function ComplianceTab({ initial, canEdit }: { initial: ComplianceSettings; canEdit: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const toggle = (key: string) => {
    setSaved(false);
    setValue((v) => ({
      ...v,
      regulations: v.regulations.includes(key)
        ? v.regulations.filter((r) => r !== key)
        : [...v.regulations, key],
    }));
  };

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await saveComplianceAction(value);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-navy text-lg font-bold">Réglementations applicables</h2>
              <p className="text-muted text-sm">
                Sélectionnez les réglementations qui s&apos;appliquent à votre organisation.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                disabled={pending}
                onClick={save}
                className="bg-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="size-4" aria-hidden />{" "}
                {pending ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
            )}
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {REGULATIONS.map((r) => {
              const on = value.regulations.includes(r.key);
              return (
                <li key={r.key}>
                  <label
                    className={cn(
                      "focus-within:ring-brand/40 flex h-full cursor-pointer flex-col gap-1.5 rounded-xl border p-3 focus-within:ring-2",
                      on ? "border-brand bg-blue-50/60" : "border-border",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      disabled={!canEdit}
                      onChange={() => toggle(r.key)}
                    />
                    <span className="flex items-center justify-between">
                      <span className="text-navy font-bold">{r.title}</span>
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border",
                          on ? "bg-brand border-brand text-white" : "border-slate-300",
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "w-fit rounded px-1.5 py-0.5 text-[11px] font-semibold",
                        on ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {on ? "Active" : "Non activée"}
                    </span>
                    <span className="text-muted text-xs">{r.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="text-muted mt-3 text-xs">
            Cette sélection est déclarative : elle documente votre cadre réglementaire sans modifier le
            fonctionnement de la plateforme.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy text-lg font-bold">Gestion des données</h2>
          <p className="text-muted text-sm">Configurez la durée de conservation des données personnelles.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="retention" className="text-sm font-medium">
                Durée de conservation des données <span className="text-danger">*</span>
              </label>
              <select
                id="retention"
                disabled={!canEdit}
                value={value.retentionYears}
                onChange={(e) => {
                  setSaved(false);
                  setValue((v) => ({ ...v, retentionYears: Number(e.target.value) }));
                }}
                className="border-border h-11 w-full rounded-xl border bg-white px-3 text-sm disabled:bg-slate-50"
              >
                {RETENTION_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} an{y > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <p className="text-muted text-[11px]">
                Durée pendant laquelle les données des candidats et talents sont conservées.
              </p>
            </div>
            <SettingRow
              icon={Trash2}
              title="Suppression automatique"
              text="Supprimer les données à l'expiration de la durée de conservation."
              soon
            >
              <Switch checked={false} label="Suppression automatique" disabled />
            </SettingRow>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Données concernées : profils candidats, évaluations, documents, historiques d&apos;activité et
            toutes les données personnelles collectées sur la plateforme. La durée est enregistrée ; aucune
            suppression n&apos;est lancée automatiquement pour l&apos;instant.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 text-lg font-bold">
            Droits des utilisateurs <SoonBadge />
          </h2>
          <p className="text-muted text-sm">
            Les droits des candidats et talents sur leurs données personnelles.
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {RIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="border-border/70 flex items-start gap-3 rounded-xl border p-3">
                <span className="text-brand flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm">
                  <span className="text-navy block font-semibold">{title}</span>
                  <span className="text-muted block text-xs">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">
            La gestion de ces droits en libre-service (accès, rectification, effacement, portabilité)
            n&apos;est pas encore disponible.
          </p>
        </Panel>

        {error && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Paramètres de conformité enregistrés.
          </p>
        )}
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Confidentialité et consentement</h2>
          <p className="text-muted text-sm">Gérez la collecte et l&apos;utilisation des données.</p>
          <div className="mt-2 divide-y divide-slate-100">
            <SettingRow
              icon={UserCheck}
              title="Consentement explicite"
              text="Demander le consentement lors de l'inscription."
              soon
            >
              <Switch checked label="Obtenir le consentement explicite" disabled />
            </SettingRow>
            <SettingRow
              icon={Database}
              title="Traitement des données"
              text="Utilisation pour le recrutement et l'évaluation."
              soon
            >
              <Switch checked label="Autoriser le traitement des données" disabled />
            </SettingRow>
            <SettingRow
              icon={Share2}
              title="Partage avec des partenaires"
              text="Autoriser le partage de données."
              soon
            >
              <Switch checked={false} label="Partager avec des partenaires" disabled />
            </SettingRow>
            <SettingRow
              icon={BarChart3}
              title="Analyses anonymes"
              text="Utiliser des données anonymisées."
              soon
            >
              <Switch checked label="Utiliser pour des analyses anonymes" disabled />
            </SettingRow>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 font-bold">
            Documents et politiques <SoonBadge />
          </h2>
          <p className="text-muted text-sm">Gérez vos documents de conformité.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {["Politique de confidentialité", "Conditions d'utilisation", "Politique de cookies"].map((d) => (
              <li
                key={d}
                className="border-border/70 text-muted flex items-center gap-3 rounded-xl border p-3"
              >
                <FileText className="size-4" aria-hidden /> {d}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Audit et journalisation</h2>
          <div className="mt-2">
            <SettingRow
              icon={Users}
              title="Journaliser les accès aux données"
              text="Enregistrer les actions sur les données personnelles."
              soon
            >
              <Switch checked={false} label="Journaliser les accès aux données" disabled />
            </SettingRow>
          </div>
        </Panel>

        <div className="rounded-2xl bg-blue-50 p-5 text-sm">
          <p className="text-brand font-bold">Bon à savoir</p>
          <p className="text-muted mt-1">
            La conformité renforce la confiance de vos talents et réduit les risques légaux pour votre
            organisation.
          </p>
        </div>
      </aside>
    </div>
  );
}
