"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CloudDownload, Info, LogOut, PauseCircle, Trash2 } from "lucide-react";
import {
  deactivateOrganizationAction,
  deleteOrganizationAction,
  leaveOrganizationAction,
} from "@/app/business/parametres/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import { Panel } from "../ui";

function Block({
  icon: Icon,
  tone,
  title,
  text,
  action,
  children,
}: {
  icon: typeof Trash2;
  tone: string;
  title: string;
  text: string;
  action: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", tone)}>
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-navy text-lg font-bold">{title}</h2>
          <p className="text-muted mt-1 text-sm">{text}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </Panel>
  );
}

export function DangerTab({ organizationName, isAdmin }: { organizationName: string; isAdmin: boolean }) {
  const router = useRouter();
  const [modal, setModal] = useState<"deactivate" | "leave" | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>, to: string) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result.error) {
        setError(result.error);
        setModal(null);
      } else router.replace(to);
    });
  const canDelete = isAdmin && understood && typed.trim() === organizationName;
  const outline =
    "inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Seul un administrateur peut exporter, désactiver ou supprimer l&apos;organisation. Vous pouvez la
          quitter.
        </p>
      )}
      {error && (
        <p role="alert" className="text-danger rounded-xl bg-red-50 p-4 text-sm">
          {error}
        </p>
      )}

      <Block
        icon={CloudDownload}
        tone="bg-blue-50 text-brand"
        title="Exporter mes données"
        text="Téléchargez une copie complète des données de votre organisation (membres, offres, évaluations, compétences, paramètres) au format JSON."
        action={
          isAdmin ? (
            <a
              href="/api/business/export"
              download
              className={cn(outline, "border-brand text-brand hover:bg-blue-50")}
            >
              <CloudDownload className="size-4" aria-hidden /> Exporter les données
            </a>
          ) : (
            <button type="button" disabled className={cn(outline, "border-border text-muted")}>
              Exporter les données
            </button>
          )
        }
      >
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          L&apos;export contient les informations de l&apos;organisation, la liste des membres (sans lien
          d&apos;invitation), les départements, sites, offres d&apos;emploi, évaluations avec leurs questions,
          résultats des candidats et le référentiel de compétences.
        </p>
      </Block>

      <Block
        icon={PauseCircle}
        tone="bg-amber-50 text-amber-600"
        title="Désactiver l'organisation"
        text="Suspend temporairement l'accès à votre organisation. Vos données sont conservées et vous pourrez la réactiver à tout moment."
        action={
          <button
            type="button"
            disabled={!isAdmin}
            onClick={() => setModal("deactivate")}
            className={cn(outline, "border-amber-400 text-amber-600 hover:bg-amber-50")}
          >
            <PauseCircle className="size-4" aria-hidden /> Désactiver l&apos;organisation
          </button>
        }
      >
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Pendant la suspension, tous les membres perdent l&apos;accès à SkillPass Business. Vos données
          restent sécurisées et vos offres publiées sont retirées de la plateforme jusqu&apos;à la
          réactivation.
        </p>
      </Block>

      <Block
        icon={Trash2}
        tone="bg-red-50 text-danger"
        title="Supprimer l'organisation"
        text="Supprime définitivement votre organisation et toutes ses données. Cette action est irréversible."
        action={
          <button
            type="button"
            disabled={!canDelete || pending}
            onClick={() => run(() => deleteOrganizationAction(typed), "/business/onboarding")}
            className={cn(outline, "border-danger text-danger hover:bg-red-50")}
          >
            <Trash2 className="size-4" aria-hidden /> {pending ? "Suppression…" : "Supprimer l'organisation"}
          </button>
        }
      >
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Attention : toutes les données (offres, évaluations, équipes, paramètres…) seront définitivement
          supprimées et les offres retirées de la plateforme. Cette action ne peut pas être annulée.
        </p>
        <label className="mt-4 flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            disabled={!isAdmin}
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="accent-danger mt-0.5 size-4"
          />
          Je comprends que cette action est irréversible et que toutes les données de mon organisation seront
          supprimées.
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-navy font-medium">Pour confirmer, saisissez « {organizationName} »</span>
          <input
            value={typed}
            disabled={!isAdmin}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="border-border mt-1.5 h-11 w-full rounded-xl border bg-white px-4 text-sm disabled:bg-slate-50"
          />
        </label>
      </Block>

      <Block
        icon={LogOut}
        tone="bg-slate-100 text-slate-600"
        title="Quitter l'organisation"
        text="Vous pouvez quitter cette organisation si vous n'en êtes plus membre. Un autre administrateur devra reprendre la gestion."
        action={
          <button
            type="button"
            onClick={() => setModal("leave")}
            className={cn(outline, "border-border text-navy hover:bg-slate-50")}
          >
            <LogOut className="size-4" aria-hidden /> Quitter l&apos;organisation
          </button>
        }
      />

      <Modal open={modal === "deactivate"} onClose={() => setModal(null)} title="Désactiver l'organisation ?">
        <p className="text-muted text-sm">
          Plus personne, vous compris, ne pourra utiliser SkillPass Business tant qu&apos;un administrateur ne
          l&apos;aura pas réactivée depuis la page de suspension.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModal(null)}>
            Annuler
          </Button>
          <Button
            disabled={pending}
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => run(deactivateOrganizationAction, "/business/suspendue")}
          >
            {pending ? "Désactivation…" : "Désactiver"}
          </Button>
        </div>
      </Modal>
      <Modal open={modal === "leave"} onClose={() => setModal(null)} title="Quitter l'organisation ?">
        <p className="text-muted text-sm">
          Vous perdrez l&apos;accès à « {organizationName} ». Un administrateur devra vous réinviter pour y
          revenir.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModal(null)}>
            Annuler
          </Button>
          <Button disabled={pending} onClick={() => run(leaveOrganizationAction, "/business/onboarding")}>
            {pending ? "Départ…" : "Quitter"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
