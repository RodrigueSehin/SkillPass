import Link from "next/link";
import { Eye, ExternalLink, Info, Languages, MapPin, Moon } from "lucide-react";
import { Switch } from "@/components/business/settings/controls";
import { SettingRow } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";
import { TalentAvatar } from "@/components/business/talent-cards";
import { ShareButton } from "@/components/profile/share-button";
import { setPublicAction, setShowLocationAction } from "@/app/dashboard/settings/actions";
import { appUrl } from "@/lib/utils/app-url";
import { AVAILABILITY_LABELS, type ProfileDTO } from "@/types/profile";
import { ToggleSetting } from "./toggle-setting";

export function PublicProfileTab({ profile }: { profile: ProfileDTO }) {
  const url = `${appUrl()}/${profile.username}`;
  const showLocation = profile.settings.privacy.showLocation;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="p-6">
          <h2 className="text-navy text-lg font-bold">Votre profil public</h2>
          <p className="text-muted text-sm">L&apos;adresse à partager avec les recruteurs et vos contacts.</p>
          <div className="border-border mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-slate-50 p-3">
            <span className="text-navy min-w-0 flex-1 truncate font-mono text-sm">{url}</span>
            <ShareButton url={url} title={`${profile.fullName} — SkillPass`} />
            {profile.isPublic && (
              <Link
                href={`/${profile.username}`}
                target="_blank"
                rel="noopener"
                className="border-brand/40 text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
              >
                <ExternalLink className="size-4" aria-hidden /> Voir
              </Link>
            )}
          </div>
          <p className="text-muted mt-2 text-xs">
            Pour changer l&apos;adresse, modifiez votre nom d&apos;utilisateur dans{" "}
            <Link href="/dashboard/settings" className="text-brand font-semibold hover:underline">
              Profil
            </Link>
            .
          </p>
          <div className="mt-3 divide-y divide-slate-100">
            <ToggleSetting
              icon={Eye}
              title="Profil public"
              text="Visible par tous à cette adresse. Désactivé, la page affiche « introuvable »."
              initial={profile.isPublic}
              save={setPublicAction}
            />
            <ToggleSetting
              icon={MapPin}
              title="Afficher ma ville"
              text="Votre ville apparaît sur votre profil et dans la recherche des entreprises."
              initial={showLocation}
              save={setShowLocationAction}
            />
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-navy text-lg font-bold">Apparence</h2>
          <div className="mt-2 divide-y divide-slate-100">
            <SettingRow icon={Moon} title="Thème" text="Clair, sombre ou selon votre appareil." soon>
              <Switch checked={false} label="Thème sombre" disabled />
            </SettingRow>
            <SettingRow icon={Languages} title="Langue" text="Français pour le moment." soon>
              <Switch checked={false} label="Langue" disabled />
            </SettingRow>
          </div>
        </Panel>
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Aperçu</h2>
          <p className="text-muted text-sm">Ce que voit un visiteur en haut de votre profil.</p>
          <div className="border-border/70 mt-4 flex items-center gap-4 rounded-2xl border p-4">
            <TalentAvatar name={profile.fullName} className="size-16 text-xl" />
            <div className="min-w-0">
              <p className="text-navy truncate font-bold">{profile.fullName}</p>
              <p className="text-navy/85 truncate text-sm">{profile.headline ?? profile.profession ?? "—"}</p>
              <p className="text-muted truncate text-xs">
                {[showLocation ? profile.location : null, AVAILABILITY_LABELS[profile.availability]]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          {!profile.isPublic && (
            <p className="text-muted mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              Votre profil est privé : personne d&apos;autre que vous ne le voit.
            </p>
          )}
        </Panel>
        <Panel className="bg-blue-50/60 p-5">
          <p className="text-navy flex items-center gap-2 font-bold">
            <Info className="text-brand size-5" aria-hidden /> Bon à savoir
          </p>
          <p className="text-navy/80 mt-2 text-sm">
            Seuls les projets marqués comme publics sont montrés. Votre e-mail, votre téléphone et votre
            objectif professionnel ne sont jamais affichés.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
