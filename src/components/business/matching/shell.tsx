import Link from "next/link";
import { Bookmark, History, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MATCH_TABS, type MatchTab } from "@/lib/business/matching-view";

const HEADERS: Record<
  MatchTab,
  { crumb: string; title: string; subtitle: string; icon: LucideIcon; note: string }
> = {
  recherche: {
    crumb: "Recherche de talents",
    title: "Matching IA",
    subtitle: "Trouvez les meilleurs talents grâce à la correspondance de leurs compétences.",
    icon: Sparkles,
    note: "SkillPass compare les compétences, certifications et l'expérience des profils publics à vos critères.",
  },
  recommandations: {
    crumb: "Recommandations IA",
    title: "Recommandations IA",
    subtitle: "Découvrez les talents les plus pertinents pour chacune de vos offres.",
    icon: Lightbulb,
    note: "Les recommandations sont calculées pour chaque offre à partir de ses compétences, de ses certifications et de son niveau d'expérience.",
  },
  sauvegardes: {
    crumb: "Correspondances sauvegardées",
    title: "Correspondances sauvegardées",
    subtitle: "Retrouvez et gérez les talents que vous avez enregistrés pour vos futurs recrutements.",
    icon: Bookmark,
    note: "Vos correspondances sauvegardées vous permettent de constituer un vivier de talents qualifiés.",
  },
  historique: {
    crumb: "Historiques",
    title: "Historiques de matching",
    subtitle: "Consultez toutes vos recherches, recommandations et actions de matching.",
    icon: History,
    note: "Suivez l'efficacité de vos recherches et retrouvez rapidement vos précédents matchings.",
  },
};

export function MatchingHeader({ tab }: { tab: MatchTab }) {
  const h = HEADERS[tab];
  const Icon = h.icon;
  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">
        Matching IA <span aria-hidden>›</span> <span className="text-navy font-medium">{h.crumb}</span>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="border-border/60 shadow-soft text-brand flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-white">
            <Icon className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">{h.title}</h1>
            <p className="text-muted mt-1">{h.subtitle}</p>
          </div>
        </div>
        <p className="border-border/60 shadow-soft text-navy/80 max-w-md rounded-2xl border bg-white p-4 text-sm">
          {h.note}
        </p>
      </div>
    </div>
  );
}

export function MatchTabs({ current }: { current: MatchTab }) {
  return (
    <nav aria-label="Sections du matching" className="border-border/60 flex gap-6 overflow-x-auto border-b">
      {MATCH_TABS.map(([key, label]) => (
        <Link
          key={key}
          href={key === "recherche" ? "/business/matching" : `/business/matching?tab=${key}`}
          aria-current={key === current ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
            key === current
              ? "border-brand text-brand font-semibold"
              : "text-navy hover:text-brand border-transparent",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
