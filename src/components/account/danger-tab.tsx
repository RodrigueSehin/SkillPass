import { CloudDownload, Trash2, EyeOff } from "lucide-react";
import { Panel } from "@/components/business/ui";
import { SoonBadge } from "@/components/business/settings/rows";
import { setPublicAction } from "@/app/dashboard/settings/actions";
import type { ProfileDTO } from "@/types/profile";
import { ToggleSetting } from "./toggle-setting";

export function DangerTab({ profile }: { profile: ProfileDTO }) {
  return (
    <div className="space-y-6">
      <Panel className="flex flex-wrap items-center gap-5 p-6">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <CloudDownload className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-navy text-lg font-bold">Exporter mes données</h2>
          <p className="text-muted text-sm">
            Téléchargez une copie complète de votre profil, compétences, projets, expériences, certifications
            et recommandations (JSON).
          </p>
        </div>
        <a
          href="/api/account/export"
          download
          className="border-brand/40 text-brand flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
        >
          Exporter les données
        </a>
      </Panel>

      <Panel className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <EyeOff className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-navy text-lg font-bold">Mettre mon profil en pause</h2>
            <p className="text-muted text-sm">
              Masque votre profil public et vous retire de la recherche des entreprises. Vos données sont
              conservées et vous pouvez le réactiver à tout moment.
            </p>
          </div>
        </div>
        <div className="mt-3 max-w-xl">
          <ToggleSetting
            icon="eyeOff"
            title="Profil en pause"
            text={profile.isPublic ? "Votre profil est visible." : "Votre profil est masqué."}
            initial={profile.isPublic}
            save={setPublicAction}
            invert
          />
        </div>
      </Panel>

      <Panel className="flex flex-wrap items-center gap-5 p-6">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-navy flex items-center gap-2 text-lg font-bold">
            Supprimer mon compte <SoonBadge />
          </h2>
          <p className="text-muted text-sm">
            Supprime définitivement votre compte et toutes vos données. Cette action est irréversible. Elle
            n&apos;est pas encore disponible : en attendant, exportez vos données et mettez votre profil en
            pause.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="border-danger text-danger flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold opacity-50"
        >
          <Trash2 className="size-4" aria-hidden /> Supprimer mon compte
        </button>
      </Panel>
    </div>
  );
}
