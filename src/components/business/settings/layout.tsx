import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Link2,
  Lock,
  Palette,
  Settings,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const SETTINGS_TABS = [
  { key: "general", title: "Général", text: "Informations de l'organisation", icon: Settings },
  { key: "security", title: "Sécurité", text: "Accès et authentification", icon: Lock },
  { key: "notifications", title: "Notifications", text: "Préférences de communication", icon: Bell },
  { key: "integrations", title: "Intégrations", text: "Connectez vos outils", icon: Link2 },
  { key: "branding", title: "Personnalisation", text: "Image de marque et apparence", icon: Palette },
  { key: "compliance", title: "Conformité", text: "Réglementations et données", icon: ShieldCheck },
  { key: "danger", title: "Zone de danger", text: "Actions sensibles", icon: Trash2 },
] as const satisfies readonly { key: string; title: string; text: string; icon: LucideIcon }[];
export type SettingsTab = (typeof SETTINGS_TABS)[number]["key"];
export const parseSettingsTab = (v: string | undefined): SettingsTab =>
  SETTINGS_TABS.find((t) => t.key === v)?.key ?? "general";

/** Header with breadcrumb, then the list of sections on the left and the section itself on the right. */
export function SettingsLayout({ tab, children }: { tab: SettingsTab; children: React.ReactNode }) {
  const current = SETTINGS_TABS.find((t) => t.key === tab)!;
  return (
    <div className="space-y-6">
      <div>
        {tab !== "general" && (
          <nav aria-label="Fil d'Ariane" className="text-muted mb-3 flex items-center gap-2 text-sm">
            <Link href="/business/parametres" className="hover:text-brand">
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
                ? "Gérez les paramètres de votre organisation, la sécurité et les préférences de votre compte."
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
            {SETTINGS_TABS.map((t) => (
              <li key={t.key} className="shrink-0">
                <Link
                  href={t.key === "general" ? "/business/parametres" : `/business/parametres?tab=${t.key}`}
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

const PAGE_TEXT: Record<Exclude<SettingsTab, "general">, string> = {
  security: "Protégez votre organisation et gérez les accès, l'authentification et les règles de sécurité.",
  notifications:
    "Configurez vos préférences de notification pour rester informé des activités importantes de votre organisation.",
  integrations: "Connectez SkillPass à vos outils pour simplifier vos processus et centraliser vos données.",
  branding:
    "Adaptez SkillPass à l'image de votre organisation pour une expérience cohérente et professionnelle.",
  compliance:
    "Assurez la conformité de votre organisation avec les réglementations en vigueur et gérez la confidentialité des données.",
  danger: "Actions sensibles pouvant avoir un impact important sur votre organisation.",
};
