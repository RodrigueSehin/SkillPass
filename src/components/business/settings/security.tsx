import Link from "next/link";
import {
  Building2,
  Check,
  FileText,
  Globe,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Panel } from "../ui";
import { SettingRow, SoonBadge } from "./rows";
import { Switch } from "./controls";

function Card({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Lock;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start gap-3">
        <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-navy font-bold">{title}</h2>
          <p className="text-muted text-sm">{text}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </Panel>
  );
}

const linkButton =
  "border-brand/40 text-brand flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50";

export function SecurityTab() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Card
          icon={ShieldCheck}
          title="Authentification et accès"
          text="Méthodes d'authentification et règles d'accès de vos membres."
        >
          <p className="text-navy text-sm font-semibold">Méthode d&apos;authentification</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="border-brand rounded-xl border bg-blue-50/60 p-3">
              <p className="text-navy flex items-center gap-2 text-sm font-semibold">
                <Check className="bg-brand size-4 rounded-full p-0.5 text-white" aria-hidden /> E-mail et mot
                de passe
              </p>
              <p className="text-muted mt-1 text-xs">Connexion avec une adresse e-mail et un mot de passe.</p>
            </div>
            <div className="border-border rounded-xl border p-3 opacity-70">
              <p className="text-navy flex items-center gap-2 text-sm font-semibold">
                SSO (Azure AD) <SoonBadge />
              </p>
              <p className="text-muted mt-1 text-xs">Connexion avec votre annuaire d&apos;entreprise.</p>
            </div>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            <SettingRow
              icon={Lock}
              title="Authentification à deux facteurs (2FA)"
              text="Obliger les membres à activer la 2FA."
              soon
            >
              <Switch checked={false} label="Authentification à deux facteurs" disabled />
            </SettingRow>
            <SettingRow
              icon={Building2}
              title="Connexion avec Microsoft"
              text="Autoriser la connexion via les comptes Microsoft."
              soon
            >
              <Switch checked={false} label="Connexion avec Microsoft" disabled />
            </SettingRow>
            <SettingRow
              icon={Link2}
              title="Lien d'invitation sécurisé"
              text="Chaque invitation est à usage unique et expire après 7 jours."
            >
              <Switch checked label="Lien d'invitation sécurisé" disabled />
            </SettingRow>
          </div>
        </Card>

        <Card
          icon={Users}
          title="Gestion des accès"
          text="Définissez qui peut accéder aux différentes fonctionnalités de la plateforme."
        >
          <div className="divide-y divide-slate-100">
            <SettingRow
              icon={Users}
              title="Accès par rôle"
              text="Attribuez des rôles pour gérer les permissions des membres."
            >
              <Link href="/business/equipes?tab=roles" className={linkButton}>
                Gérer les rôles
              </Link>
            </SettingRow>
            <SettingRow
              icon={KeyRound}
              title="Permissions avancées"
              text="Personnalisez les droits d'accès par fonctionnalité."
            >
              <Link href="/business/equipes?tab=roles" className={linkButton}>
                Configurer
              </Link>
            </SettingRow>
            <SettingRow
              icon={Building2}
              title="Restriction par département"
              text="Limitez l'accès aux données selon les départements."
              soon
            >
              <Switch checked={false} label="Restriction par département" disabled />
            </SettingRow>
            <SettingRow
              icon={MapPin}
              title="Restriction par localisation"
              text="Limitez l'accès selon les sites ou pays."
              soon
            >
              <Switch checked={false} label="Restriction par localisation" disabled />
            </SettingRow>
          </div>
        </Card>

        <Card
          icon={Monitor}
          title="Sessions et appareils"
          text="Surveillez et gérez les sessions actives de votre organisation."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-navy flex items-center gap-2 text-sm font-semibold">
                Sessions actives <SoonBadge />
              </p>
              <p className="text-navy text-3xl font-bold">—</p>
              <p className="text-muted text-xs">membres connectés actuellement</p>
            </div>
            <SettingRow
              icon={Smartphone}
              title="Gestion des appareils"
              text="Autoriser les membres à rester connectés sur plusieurs appareils."
              soon
            >
              <Switch checked label="Gestion des appareils" disabled />
            </SettingRow>
          </div>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card
          icon={KeyRound}
          title="Règles de mot de passe"
          text="Exigences appliquées à la création d'un compte SkillPass."
        >
          <ul className="space-y-2.5 text-sm">
            {[
              ["Longueur minimale : 8 caractères", true],
              ["Au moins une lettre majuscule", true],
              ["Au moins un chiffre", true],
              ["Au moins une lettre minuscule", false],
              ["Au moins un caractère spécial", false],
            ].map(([label, on]) => (
              <li key={label as string} className="flex items-center gap-2.5">
                {on ? (
                  <Check className="size-4 text-green-600" aria-hidden />
                ) : (
                  <X className="size-4 text-slate-300" aria-hidden />
                )}
                <span className={cn(on ? "text-navy" : "text-muted")}>{label as string}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">
            Ces règles sont les mêmes pour tous les comptes ; elles ne se règlent pas encore par organisation.
          </p>
        </Card>

        <Card
          icon={Globe}
          title="Accès réseau"
          text="Contrôlez depuis quels réseaux vos membres peuvent se connecter."
        >
          <ul className="space-y-2 text-sm">
            <li className="border-brand rounded-xl border bg-blue-50/60 p-3">
              <p className="text-navy font-semibold">Autoriser tous les réseaux</p>
              <p className="text-muted text-xs">Accès depuis n&apos;importe quel réseau.</p>
            </li>
            {["Restreindre aux réseaux de l'entreprise", "Liste blanche d'adresses IP"].map((t) => (
              <li key={t} className="border-border rounded-xl border p-3 opacity-70">
                <p className="text-navy flex items-center gap-2 font-semibold">
                  {t} <SoonBadge />
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          icon={FileText}
          title="Audit et journalisation"
          text="Suivez les activités sensibles pour plus de transparence."
        >
          <div className="divide-y divide-slate-100">
            <SettingRow
              icon={Users}
              title="Journaliser les connexions"
              text="Enregistrer les tentatives de connexion."
              soon
            >
              <Switch checked={false} label="Journaliser les connexions" disabled />
            </SettingRow>
            <SettingRow
              icon={ShieldCheck}
              title="Journaliser les actions importantes"
              text="Suivre les modifications des paramètres et des accès."
              soon
            >
              <Switch checked={false} label="Journaliser les actions importantes" disabled />
            </SettingRow>
          </div>
        </Card>

        <div className="rounded-2xl bg-blue-50 p-5 text-sm">
          <p className="text-brand font-bold">Bon à savoir</p>
          <p className="text-muted mt-1">
            Une bonne configuration de la sécurité protège les données de votre organisation et renforce la
            confiance de vos équipes.
          </p>
        </div>
      </aside>
    </div>
  );
}
