import Link from "next/link";
import { BellRing, CalendarClock, Eye, Globe, IdCard, Mail, MapPin, Search, UserRound } from "lucide-react";
import { SettingRow } from "@/components/business/settings/rows";
import { Switch } from "@/components/business/settings/controls";
import { Panel } from "@/components/business/ui";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { setDirectoryAction, setPublicAction, setShowLocationAction } from "@/app/dashboard/settings/actions";
import { ROLE_LABELS, type ProfileDTO } from "@/types/profile";
import { ToggleSetting } from "./toggle-setting";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function GeneralTab({ profile, email }: { profile: ProfileDTO; email: string }) {
  const { privacy } = profile.settings;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="min-w-0 p-6">
        <h2 className="text-navy text-xl font-bold">Informations personnelles</h2>
        <p className="text-muted text-sm">Mettez à jour votre profil professionnel.</p>
        <div className="mt-5">
          <ProfileSettingsForm profile={profile} />
        </div>
      </Panel>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Paramètres rapides</h2>
          <p className="text-muted text-sm">Configurez rapidement les options essentielles.</p>
          <div className="mt-2 divide-y divide-slate-100">
            <ToggleSetting
              icon={Eye}
              title="Profil public"
              text={`Visible à l'adresse /${profile.username}`}
              initial={profile.isPublic}
              save={setPublicAction}
            />
            <ToggleSetting
              icon={Search}
              title="Visible par les entreprises"
              text="Apparaître dans la recherche de talents"
              initial={privacy.inDirectory}
              save={setDirectoryAction}
              disabled={!profile.isPublic}
            />
            <ToggleSetting
              icon={MapPin}
              title="Afficher ma ville"
              text="Sur votre profil public"
              initial={privacy.showLocation}
              save={setShowLocationAction}
            />
            <SettingRow
              icon={BellRing}
              title="Alertes par e-mail"
              text="Recevoir les opportunités par e-mail"
              soon
            >
              <Switch checked={false} label="Alertes par e-mail" disabled />
            </SettingRow>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Informations du compte</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="text-muted size-4 shrink-0" aria-hidden />
              <dt className="text-muted w-28 shrink-0">E-mail</dt>
              <dd className="text-navy truncate">{email}</dd>
            </div>
            <div className="flex items-center gap-3">
              <IdCard className="text-muted size-4 shrink-0" aria-hidden />
              <dt className="text-muted w-28 shrink-0">Identifiant</dt>
              <dd className="text-navy truncate">@{profile.username}</dd>
            </div>
            <div className="flex items-center gap-3">
              <UserRound className="text-muted size-4 shrink-0" aria-hidden />
              <dt className="text-muted w-28 shrink-0">Rôle</dt>
              <dd className="text-navy">{ROLE_LABELS[profile.role]}</dd>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="text-muted size-4 shrink-0" aria-hidden />
              <dt className="text-muted w-28 shrink-0">Statut</dt>
              <dd>
                <span
                  className={
                    profile.isPublic
                      ? "rounded-md bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"
                      : "rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  }
                >
                  {profile.isPublic ? "Profil public" : "Profil privé"}
                </span>
              </dd>
              <Link
                href="/dashboard/settings?tab=public"
                className="text-brand ml-auto text-xs font-semibold hover:underline"
              >
                Gérer
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <CalendarClock className="text-muted size-4 shrink-0" aria-hidden />
              <dt className="text-muted w-28 shrink-0">Mis à jour le</dt>
              <dd className="text-navy">{DATE.format(new Date(profile.updatedAt))}</dd>
            </div>
          </dl>
        </Panel>
      </aside>
    </div>
  );
}
