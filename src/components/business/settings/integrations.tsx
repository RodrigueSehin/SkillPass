import Link from "next/link";
import { Code2, KeyRound, LifeBuoy, Plug, Search, Webhook } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Panel } from "../ui";
import { SoonBadge } from "./rows";

const CATEGORIES = [
  ["all", "Toutes les intégrations"],
  ["hr", "RH & SIRH"],
  ["communication", "Communication"],
  ["productivity", "Productivité"],
  ["other", "Autres"],
] as const;
type Category = (typeof CATEGORIES)[number][0];

interface Integration {
  name: string;
  text: string;
  category: Exclude<Category, "all">;
  popular: boolean;
  /** Tile colours: initials on a brand-like background. No third-party logos are bundled. */
  tile: string;
}

const CATALOG: Integration[] = [
  {
    name: "Microsoft 365",
    text: "Importez vos utilisateurs, synchronisez les équipes et utilisez Outlook.",
    category: "productivity",
    popular: true,
    tile: "bg-orange-100 text-orange-700",
  },
  {
    name: "Azure Active Directory",
    text: "Connexion SSO et synchronisation des utilisateurs.",
    category: "hr",
    popular: true,
    tile: "bg-blue-100 text-blue-700",
  },
  {
    name: "Google Workspace",
    text: "Synchronisez vos utilisateurs et collaborez avec Google.",
    category: "productivity",
    popular: true,
    tile: "bg-red-100 text-red-600",
  },
  {
    name: "Slack",
    text: "Recevez des notifications et collaborez avec vos équipes.",
    category: "communication",
    popular: true,
    tile: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    name: "Microsoft Teams",
    text: "Notifications, approbations et collaboration.",
    category: "communication",
    popular: true,
    tile: "bg-violet-100 text-violet-700",
  },
  {
    name: "LinkedIn",
    text: "Publiez des offres et importez des profils talents.",
    category: "other",
    popular: true,
    tile: "bg-sky-100 text-sky-700",
  },
  {
    name: "SAP SuccessFactors",
    text: "Synchronisez vos données RH (employés, postes, compétences).",
    category: "hr",
    popular: false,
    tile: "bg-blue-100 text-blue-700",
  },
  {
    name: "Workday",
    text: "Intégrez vos données de gestion des talents.",
    category: "hr",
    popular: false,
    tile: "bg-amber-100 text-amber-700",
  },
  {
    name: "BambooHR",
    text: "Synchronisez vos collaborateurs et leurs compétences.",
    category: "hr",
    popular: false,
    tile: "bg-green-100 text-green-700",
  },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function IntegrationCard({ item }: { item: Integration }) {
  return (
    <li className="border-border/70 flex flex-col rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            item.tile,
          )}
          aria-hidden
        >
          {initials(item.name)}
        </span>
        <div className="min-w-0">
          <p className="text-navy truncate font-bold">{item.name}</p>
          <p className="flex items-center gap-1.5 text-xs">
            <span className="text-muted rounded bg-slate-100 px-1.5 py-0.5 font-medium">Non connecté</span>{" "}
            <SoonBadge />
          </p>
        </div>
      </div>
      <p className="text-muted mt-3 flex-1 text-xs leading-relaxed">{item.text}</p>
      <button
        type="button"
        disabled
        className="border-border text-muted mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-slate-50 text-sm font-semibold"
      >
        <Plug className="size-4" aria-hidden /> Connecter
      </button>
    </li>
  );
}

export function IntegrationsTab({ category, query }: { category: string; query: string }) {
  const cat: Category = CATEGORIES.find(([k]) => k === category)?.[0] ?? "all";
  const q = query.trim().toLowerCase();
  const visible = CATALOG.filter(
    (i) => (cat === "all" || i.category === cat) && (!q || `${i.name} ${i.text}`.toLowerCase().includes(q)),
  );
  const popular = visible.filter((i) => i.popular);
  const others = visible.filter((i) => !i.popular);
  const href = (key: Category) =>
    key === "all"
      ? "/business/parametres?tab=integrations"
      : `/business/parametres?tab=integrations&cat=${key}`;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel className="min-w-0 p-5">
        <nav
          aria-label="Catégories d'intégrations"
          className="border-border/60 flex gap-5 overflow-x-auto border-b"
        >
          {CATEGORIES.map(([key, label]) => (
            <Link
              key={key}
              href={href(key)}
              aria-current={key === cat ? "page" : undefined}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-1 py-3 text-sm font-medium",
                key === cat
                  ? "border-brand text-brand font-semibold"
                  : "text-navy hover:text-brand border-transparent",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
          <Plug className="text-brand mt-0.5 size-6 shrink-0" aria-hidden />
          <div>
            <p className="text-brand font-bold">Connectez vos outils préférés</p>
            <p className="text-muted text-sm">
              Les intégrations arrivent bientôt : synchronisez vos données, automatisez vos processus et
              gagnez en efficacité.
            </p>
          </div>
        </div>

        <form action="/business/parametres" method="get" className="mt-5 flex flex-wrap gap-3">
          <input type="hidden" name="tab" value="integrations" />
          <div className="relative min-w-52 flex-1">
            <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
            <input
              name="q"
              defaultValue={query}
              aria-label="Rechercher une intégration"
              placeholder="Rechercher une intégration…"
              className="border-border h-11 w-full rounded-xl border bg-white pr-3 pl-10 text-sm"
            />
          </div>
          <select
            name="cat"
            defaultValue={cat}
            aria-label="Catégorie"
            className="border-border h-11 rounded-xl border bg-white px-3 text-sm"
          >
            {CATEGORIES.map(([key, label]) => (
              <option key={key} value={key}>
                {key === "all" ? "Toutes les catégories" : label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-brand h-11 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Filtrer
          </button>
        </form>

        {visible.length === 0 && (
          <p className="text-muted mt-8 text-center text-sm">
            Aucune intégration ne correspond à votre recherche.
          </p>
        )}
        {popular.length > 0 && (
          <>
            <h2 className="text-navy mt-6 font-bold">Intégrations populaires</h2>
            <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {popular.map((i) => (
                <IntegrationCard key={i.name} item={i} />
              ))}
            </ul>
          </>
        )}
        {others.length > 0 && (
          <>
            <h2 className="text-navy mt-6 font-bold">Autres intégrations</h2>
            <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {others.map((i) => (
                <IntegrationCard key={i.name} item={i} />
              ))}
            </ul>
          </>
        )}
      </Panel>

      <aside className="space-y-6">
        {[
          {
            icon: Code2,
            title: "Intégration personnalisée",
            text: "Besoin d'une intégration spécifique ? Notre API permettra de connecter vos outils sur mesure.",
            action: "Voir la documentation API",
          },
          {
            icon: KeyRound,
            title: "Clés API",
            text: "Gérez vos clés pour accéder à l'API SkillPass.",
            action: "Gérer mes clés API",
          },
          {
            icon: Webhook,
            title: "Webhooks",
            text: "Configurez des webhooks pour recevoir des événements en temps réel.",
            action: "Configurer les webhooks",
          },
        ].map(({ icon: Icon, title, text, action }) => (
          <Panel key={title} className="p-5">
            <div className="flex items-start gap-3">
              <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-navy flex items-center gap-2 font-bold">
                  {title} <SoonBadge />
                </h2>
                <p className="text-muted mt-1 text-sm">{text}</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="border-border text-muted mt-4 h-10 w-full rounded-xl border bg-slate-50 text-sm font-semibold"
            >
              {action}
            </button>
          </Panel>
        ))}
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-5 text-sm">
          <LifeBuoy className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-brand font-bold">Besoin d&apos;aide ?</p>
            <p className="text-muted mt-1">
              Les intégrations sont en préparation. Dites-nous celles qui comptent le plus pour votre
              organisation.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
