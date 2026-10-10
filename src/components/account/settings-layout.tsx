import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Link2,
  Lock,
  Palette,
  ShieldCheck,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const ACCOUNT_TABS = [
  { key: "general", title: "Profil", text: "Informations personnelles", icon: UserRound },
  { key: "security", title: "Sécurité", text: "Mot de passe et sessions", icon: Lock },
  { key: "notifications", title: "Notifications", text: "Préférences de communication", icon: Bell },
  { key: "integrations", title: "Intégrations", text: "Connectez vos outils", icon: Link2 },
  { key: "public", title: "Profil public", text: "Visibilité et affichage", icon: Palette },
  { key: "privacy", title: "Confidentialité", text: "Données et consentement", icon: ShieldCheck },
  { key: "danger", title: "Zone de danger", text: "Actions sensibles", icon: Trash2 },
] as const satisfies readonly { key: string; title: string; text: string; icon: LucideIcon }[];
export type AccountTab = (typeof ACCOUNT_TABS)[number]["key"];
/** Sections reserved to the general administrator of SkillPass. */
export const PLATFORM_ACCOUNT_TABS: readonly AccountTab[] = ["integrations"];
export const visibleAccountTabs = (platformAdmin: boolean) =>
  ACCOUNT_TABS.filter((t) => platformAdmin || !PLATFORM_ACCOUNT_TABS.includes(t.key));
export const parseAccountTab = (v: string | undefined, platformAdmin: boolean): AccountTab =>
  visibleAccountTabs(platformAdmin).find((t) => t.key === v)?.key ?? "general";

const PAGE_TEXT: Record<Exclude<AccountTab, "general">, string> = {
  security: "Protégez votre compte et gérez votre mot de passe et vos sessions.",
  notifications: "Choisissez comment et quand SkillPass vous prévient des événements importants.",
  integrations: "Connectez SkillPass à vos outils pour importer vos données et gagner du temps.",
  public: "Contrôlez ce que les visiteurs et les entreprises voient de votre profil.",
  privacy: "Gérez la confidentialité de vos données et exercez vos droits.",
  danger: "Actions sensibles pouvant avoir un impact important sur votre compte.",
};

/** Header with breadcrumb, then the list of sections on the left and the section itself on the right. */
export function AccountSettingsLayout({
  tab,
  platformAdmin,
  children,
}: {
  tab: AccountTab;
  platformAdmin: boolean;
  children: React.ReactNode;
}) {
  const current = ACCOUNT_TABS.find((t) => t.key === tab)!;
  return (
    <div className="space-y-6">
      <div>
        {tab !== "general" && (
          <nav aria-label="Fil d'Ariane" className="text-muted mb-3 flex items-center gap-2 text-sm">
            <Link href="/dashboard/settings" className="hover:text-brand">
              Paramètres
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-navy font-medium">{current.title}</span>
          </nav>
        )}
        <div className="flex items-start gap-4">
          {tab !== "general" && (
            <span className="border-border text-brand flex size-12 shrink-0 items-center justify-center rounded-xl border bg-white">
              <current.icon className="size-6" aria-hidden />
            </span>
          )}
          <div>
            <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">
              {tab === "general" ? "Paramètres" : current.title}
            </h1>
            <p className="text-muted mt-1">
              {tab === "general"
                ? "Gérez votre profil, votre sécurité et les préférences de votre compte."
                : PAGE_TEXT[tab]}
            </p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Sections des paramètres"
          className="border-border/60 shadow-soft rounded-2xl border bg-white p-2 lg:sticky lg:top-24"
        >
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {visibleAccountTabs(platformAdmin).map((t) => (
              <li key={t.key} className="shrink-0">
                <Link
                  href={t.key === "general" ? "/dashboard/settings" : `/dashboard/settings?tab=${t.key}`}
                  aria-current={t.key === tab ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3",
                    t.key === tab ? "bg-blue-50" : "hover:bg-slate-50",
                  )}
                >
                  <t.icon
                    className={cn("size-5 shrink-0", t.key === "danger" ? "text-danger" : "text-brand")}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        t.key === tab ? "text-brand" : "text-navy",
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="text-muted hidden text-xs lg:block">{t.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
