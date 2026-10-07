import Link from "next/link";
import { BarChart3, ChevronRight, FilePlus2, Library, type LucideIcon } from "lucide-react";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { EVALUATION_TYPE_LABELS, type EvaluationType } from "@/types/evaluation";
import { Donut, RateBar } from "./charts";
import { Panel } from "./ui";

export function QuickActions({ canCreate }: { canCreate: boolean }) {
  const items: { href: string; icon: LucideIcon; title: string; text: string; show: boolean }[] = [
    {
      href: "/business/evaluations/nouvelle",
      icon: FilePlus2,
      title: "Créer une évaluation",
      text: "Concevez un nouveau test",
      show: canCreate,
    },
    {
      href: "/business/evaluations?tab=library",
      icon: Library,
      title: "Utiliser un modèle",
      text: "Parcourez la bibliothèque",
      show: canCreate,
    },
    {
      href: "/business/evaluations?tab=results",
      icon: BarChart3,
      title: "Voir les résultats",
      text: "Analysez les performances",
      show: true,
    },
  ];
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Actions rapides</h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {items
          .filter((i) => i.show)
          .map(({ href, icon: Icon, title, text }) => (
            <li key={title}>
              <Link href={href} className="flex items-center gap-3 py-3 hover:opacity-80">
                <span className="text-brand flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block text-sm font-semibold">{title}</span>
                  <span className="text-muted block text-xs">{text}</span>
                </span>
                <ChevronRight className="text-muted size-4" aria-hidden />
              </Link>
            </li>
          ))}
      </ul>
    </Panel>
  );
}

const TYPE_COLORS: Record<EvaluationType, string> = {
  TECHNICAL: "#16A34A",
  TRANSVERSAL: "#2563EB",
  CERTIFICATION: "#A855F7",
};

export function TypeDistribution({
  items,
  total,
}: {
  items: { type: EvaluationType; count: number; percent: number }[];
  total: number;
}) {
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Répartition des évaluations</h2>
      <div className="mt-4 flex items-center gap-5">
        <Donut
          label="Répartition des évaluations par type"
          center={total}
          caption="évaluations"
          size={112}
          segments={items.map((i) => ({ label: i.type, value: i.count, color: TYPE_COLORS[i.type] }))}
        />
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.type} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: TYPE_COLORS[i.type] }}
              />
              <span className="text-navy truncate">{EVALUATION_TYPE_LABELS[i.type].title}s</span>
              <span className="text-navy ml-auto font-semibold">{i.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function SuccessBySkill({
  items,
  href,
  className,
}: {
  items: { skill: string; rate: number; candidates: number }[];
  href?: string;
  className?: string;
}) {
  return (
    <Panel className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Taux de réussite par compétence</h2>
        {href && (
          <Link href={href} className="text-brand text-sm font-semibold hover:underline">
            Voir tout
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted mt-3 text-sm">
          Les taux apparaîtront dès que des candidats auront passé vos évaluations.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((s) => {
            const visual = skillVisual(s.skill);
            return (
              <li key={s.skill} className="flex items-center gap-3">
                <span
                  className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", visual.tile)}
                >
                  <visual.icon className="size-4" aria-hidden />
                </span>
                <span className="text-navy w-28 shrink-0 truncate text-sm">{s.skill}</span>
                <RateBar value={s.rate} className="flex-1" />
                <span className="text-navy w-10 text-right text-sm font-semibold">{s.rate}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
