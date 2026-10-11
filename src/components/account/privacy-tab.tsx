import Link from "next/link";
import { Check, Download, FileSearch, Info, PencilLine, Trash2, X } from "lucide-react";
import { Panel } from "@/components/business/ui";
import { setDirectoryAction } from "@/app/dashboard/settings/actions";
import type { ProfileDTO } from "@/types/profile";
import { ToggleSetting } from "./toggle-setting";

const SEEN = [
  "Nom, titre et profession",
  "Compétences et niveaux",
  "Certifications",
  "Expériences et projets publics",
  "Disponibilité",
];
const NEVER = ["Adresse e-mail", "Numéro de téléphone", "Objectif professionnel", "Projets privés"];

const rowButton =
  "border-brand/40 text-brand flex h-10 shrink-0 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50";

export function PrivacyTab({ profile }: { profile: ProfileDTO }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="p-6">
          <h2 className="text-navy text-lg font-bold">Visibilité auprès des entreprises</h2>
          <p className="text-muted text-sm">
            Les entreprises qui utilisent SkillPass Business peuvent trouver les profils publics.
          </p>
          <div className="mt-3">
            <ToggleSetting
              icon="search"
              title="Apparaître dans la recherche de talents"
              text={
                profile.isPublic
                  ? "Les entreprises peuvent vous trouver et sauvegarder votre profil."
                  : "Votre profil est privé : activez d'abord le profil public."
              }
              initial={profile.settings.privacy.inDirectory}
              save={setDirectoryAction}
              disabled={!profile.isPublic}
            />
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-navy text-lg font-bold">Vos droits sur vos données</h2>
          <p className="text-muted text-sm">Accédez à vos données, corrigez-les ou supprimez-les.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            <li className="flex flex-wrap items-center gap-3 py-3">
              <FileSearch className="text-brand size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-navy text-sm font-semibold">Accès et portabilité</p>
                <p className="text-muted text-xs">
                  Téléchargez toutes vos données dans un fichier JSON lisible.
                </p>
              </div>
              <a href="/api/account/export" download className={rowButton}>
                <Download className="size-4" aria-hidden /> Exporter
              </a>
            </li>
            <li className="flex flex-wrap items-center gap-3 py-3">
              <PencilLine className="text-brand size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-navy text-sm font-semibold">Rectification</p>
                <p className="text-muted text-xs">Corrigez à tout moment les informations de votre profil.</p>
              </div>
              <Link href="/dashboard/settings" className={rowButton}>
                Modifier
              </Link>
            </li>
            <li className="flex flex-wrap items-center gap-3 py-3">
              <Trash2 className="text-danger size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-navy text-sm font-semibold">Effacement</p>
                <p className="text-muted text-xs">
                  Retirez votre profil ou demandez la suppression du compte.
                </p>
              </div>
              <Link href="/dashboard/settings?tab=danger" className={rowButton}>
                Voir
              </Link>
            </li>
          </ul>
        </Panel>
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Ce que voient les entreprises</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {SEEN.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <Check className="size-4 rounded-full bg-green-600 p-0.5 text-white" aria-hidden /> {s}
              </li>
            ))}
          </ul>
          <h3 className="text-navy mt-4 text-sm font-bold">Jamais montré</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {NEVER.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <X className="size-4 rounded-full bg-slate-400 p-0.5 text-white" aria-hidden /> {s}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="bg-blue-50/60 p-5">
          <p className="text-navy flex items-center gap-2 font-bold">
            <Info className="text-brand size-5" aria-hidden /> Bon à savoir
          </p>
          <p className="text-navy/80 mt-2 text-sm">
            Le contact passe toujours par votre profil public : une entreprise ne reçoit jamais vos
            coordonnées.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
